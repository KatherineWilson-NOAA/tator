
import * as MP4Box from "mp4box";

// Internal class to write out a blob of data
class Writer {
  constructor(size) {
    this.data = new Uint8Array(size);
    this.idx = 0;
    this.size = size;
  }

  getData() {
    if(this.idx != this.size)
      throw "Mismatch between size reserved and sized used"

    return this.data.slice(0, this.idx);
  }

  writeUint8(value) {
    this.data.set([value], this.idx);
    this.idx++;
  }

  writeUint16(value) {
    // TODO: find a more elegant solution to endianess.
    var arr = new Uint16Array(1);
    arr[0] = value;
    var buffer = new Uint8Array(arr.buffer);
    this.data.set([buffer[1], buffer[0]], this.idx);
    this.idx +=2;
  }

  writeUint8Array(value) {
    this.data.set(value, this.idx);
    this.idx += value.length;
  }
}

// Manages a unique ordered list of keyframes provides access routines to find the nearest 
// keyframe given an input
// This method is overkill for fixed size fragments, but enables variable sized GOP playback
class KeyHeap {
  constructor()
  {
    this.clear();
  }

  // Clear knowledge of all keyframes
  clear()
  {
    this._buf = [];
  }

  // Add a new key frame location
  // Skip any previously encountered keyframes
  push(val)
  {
    let closest = this.closest_keyframe(val).thisSegment;
    if (val != closest)
    {
      this._buf.push(val);
      this._buf.sort((a,b)=>a-b);
      return false;
    }
    else
    {
      return true;
    }
  }

  // Find the closest preceding keyframe
  // @TODO: check for length/validity
  closest_keyframe(val)
  {
    let lastDistance = Number.MAX_VALUE;
    let lastTimestamp = 0;
    let idx = 0;
    for (idx = 0; idx < this._buf.length; idx++)
    {
      let timestamp = this._buf[idx];
      let thisDistance = val-timestamp;
      // Great Scott: Don't pull keyframes from the future.
      if (thisDistance < lastDistance && thisDistance >= 0)
      {
        lastDistance = thisDistance
        lastTimestamp = timestamp;
      }
      else
      {
        break;
      }
    }

    let nextSegment=null;
    let nearBoundary=false;
    if (idx < this._buf.length)
    {
      nextSegment = this._buf[idx];
      if (Math.abs(val-nextSegment) < Math.abs(val-lastTimestamp))
      {
        nearBoundary = true;
      }
    }

    return {"thisSegment": lastTimestamp, "nextSegment": nextSegment, "nearBoundary": nearBoundary};
  }
}

class TatorVideoBuffer {
  constructor(name)
  {
    this._name = name;
    this.use_codec_buffer = true;

    // Create MP4 unpacking elements
    this._mp4File = MP4Box.createFile();
    this._mp4File.onError = this._mp4OnError.bind(this);
    this._mp4File.onReady = this._mp4OnReady.bind(this);
    this._mp4File.onSamples = this._mp4Samples.bind(this);
    this._keyframes = new KeyHeap();

    this._videoDecoder = new VideoDecoder({
      output: this._frameReady.bind(this),
      error: this._frameError.bind(this)});

    // For  lack of a better guess put the default video cursor at 0
    this._current_cursor = 0.0;
    this._current_duration = 0.0;

    this._hot_frame_keys=[];
  }

  _mp4OnError(e)
  {
    console.error(`${this._name} buffer reports ${e}`);
    if (this._loadedDataError)
    {
      this._loadedDataError();
    }
  }

  _getExtradata(avccBox) {
    try
    {
      var i;
      var size = 7;
      for (i = 0; i < avccBox.SPS.length; i++) {
        // nalu length is encoded as a uint16.
        size+= 2 + avccBox.SPS[i].length;
      }
      for (i = 0; i < avccBox.PPS.length; i++) {
        // nalu length is encoded as a uint16.
        size+= 2 + avccBox.PPS[i].length;
      }

      var writer = new Writer(size);

      writer.writeUint8(avccBox.configurationVersion);
      writer.writeUint8(avccBox.AVCProfileIndication);
      writer.writeUint8(avccBox.profile_compatibility);
      writer.writeUint8(avccBox.AVCLevelIndication);
      writer.writeUint8(avccBox.lengthSizeMinusOne + (63<<2));

      writer.writeUint8(avccBox.nb_SPS_nalus + (7<<5));
      for (i = 0; i < avccBox.SPS.length; i++) {
        writer.writeUint16(avccBox.SPS[i].length);
        writer.writeUint8Array(avccBox.SPS[i].nalu);
      }

      writer.writeUint8(avccBox.nb_PPS_nalus);
      for (i = 0; i < avccBox.PPS.length; i++) {
        writer.writeUint16(avccBox.PPS[i].length);
        writer.writeUint8Array(avccBox.PPS[i].nalu);
      }

      return writer.getData();
    }
    catch (e)
    {
      console.warn(e);
      return null;
    }
  }

  _mp4OnReady(info)
  {
    this._codecString = info.tracks[0].codec;
    this._trackWidth = Math.round(info.tracks[0].track_width);
    this._trackHeight = Math.round(info.tracks[0].track_height);
    this._timescale = info.tracks[0].timescale;
    this._playing = false;

    // The canvas is used to render seek frames so we don't use up 
    // slots in the real-time memory of the VideoDecoder object, from the 
    // context we can generate ImageBitmap which should render fast enough
    // for seek or scrub conops.
    this._canvas = new OffscreenCanvas(this._trackWidth, this._trackHeight);
    //this._canvas = new OffscreenCanvas(320, 144);
    this._canvasCtx = this._canvas.getContext("2d", {desynchronized:true});

    let description = this._getExtradata(this._mp4File.moov.traks[0].mdia.minf.stbl.stsd.entries[0].avcC);

    if (description)
    {
      this._codecConfig = {
        codec: this._codecString,
        codedWidth: Number(this._trackWidth),
        codedHeight: Number(this._trackHeight),
        description: description};
    }
    else
    {
      // Resolve Issue parsing MIME string from AV1, digit isn't 0 padded, but should be.
      this._codecString = this._codecString.replace('.0M', '.00M');
      this._codecString = this._codecString.replace('.1M', '.01M');
      this._codecString = this._codecString.replace('.2M', '.02M');
      this._codecString = this._codecString.replace('.3M', '.03M');
      this._codecString = this._codecString.replace('.4M', '.04M');
      this._codecString = this._codecString.replace('.5M', '.05M');
      this._codecString = this._codecString.replace('.6M', '.06M');
      this._codecString = this._codecString.replace('.7M', '.07M');
      this._codecString = this._codecString.replace('.8M', '.08M');
      this._codecString = this._codecString.replace('.9M', '.09M');

      // Configure codec
      this._codecConfig = {
        codec: this._codecString,
        codedWidth: Number(this._trackWidth),
        codedHeight: Number(this._trackHeight)};
    }
    console.info(JSON.stringify(info.tracks[0]));
    console.info(`${this._name} is configuring decoder = ${JSON.stringify(this._codecConfig)}`);
    this._videoDecoder.configure(this._codecConfig);
    console.info(`${this._name} decoder reports ${this._videoDecoder.state}`);

    // Configure segment callback
    this._mp4File.setExtractionOptions(info.tracks[0].id);
    this._mp4File.start();
    console.info(JSON.stringify(info));

    postMessage({"type": "ready",
                 "data": info});
  }

  _mp4Samples(track_id, ref, samples)
  {
    //console.info(`${performance.now()}: Calling mp4 samples, count=${samples.length} ${samples[0].cts}`);
    let muted = true;

    // Samples can be out of CTS order, when calculating frame diff
    // take that into consideration
    if (this._frame_delta == undefined)
    {
      if (samples.length > 2)
      {
        let times = [];
        for (let idx=0; idx < Math.min(10,samples.length); idx++)
        {
          times.push(samples[idx].cts);
        }
        times.sort((a,b)=>a-b);
        this._frame_delta = times[1]-times[0];
        postMessage({"type": "frameDelta",
                     "frameDelta": this._frame_delta});
      }
    }
    const cursor_in_ctx = this._current_cursor * this._timescale;
    if (this._frame_delta != undefined)
    {
      let sample_delta = Math.abs(cursor_in_ctx-samples[0].cts) / this._frame_delta;
      if (sample_delta <= 50)
      {
        muted = false;
      }
    }
    let done = false;
    if (muted == false || this._playing == true)
    {
      this._seek_in_progress=true;
      let timestamp = samples[0].cts;
      let buffers = [];
      
      let idx = 0;
      this._frame_count = 0;
      this._ready_frames=[];
      this._transfers=[];
      for (idx = 0; idx < samples.length; idx++)
      {
        //console.info(`${idx}: ${samples[idx].is_sync} ${samples[idx].cts} ${samples[idx].dts}`);
        if (samples[idx].is_sync)
        {
          this._keyframes.push(samples[idx].cts);
        }

        // Decode upto 4 past the next key frame.
        if (idx > 0 && samples[idx].is_sync && this._playing == false)
        {
          done=true;
          for (let overrun_idx = idx; overrun_idx < Math.min(samples.length,idx+4); overrun_idx++)
          {
            const chunk = new EncodedVideoChunk({
              type: (samples[overrun_idx].is_sync ? 'key' : 'delta'),
              timestamp: samples[overrun_idx].cts,
              data: samples[overrun_idx].data
            });
            this._videoDecoder.decode(chunk);
          }
          break;
        }

        const chunk = new EncodedVideoChunk({
          type: (samples[idx].is_sync ? 'key' : 'delta'),
          timestamp: samples[idx].cts,
          data: samples[idx].data
        });
        this._videoDecoder.decode(chunk);

        
      }
      this._decode_block_size = idx;
      //console.info(`Asking to decode ${idx} frames from ${samples.length} START=${samples[0].cts}`);
    }
    else
    {
      // Push any undiscovered keyframes
      for (let idx = samples.length-1; idx >= 0; idx--)
      {
        if (samples[idx].is_sync)
        {
          if (this._keyframes.push(samples[idx].cts))
          {
            done = true;
            break;
          }
        }
      }
    }
    if (done == true)
    {
      this._mp4File.stop(); // stop processing samples if we have decoded plenty
    }
    //console.info(`${performance.now()}: Finished mp4 samples, count=${samples.length}`);
  }

  pause()
  {
    this._playing = false;
    this._mp4File.stop();
  }

  play()
  {
    console.info(`PLAYING VIDEO ${this._current_cursor}`);
    this._playing = true;
    this._mp4File.seek(this._current_cursor);
    this._mp4File.start();
  }


  _frameReady(frame)
  {
    let frameCopy = null;
    //console.info(`${this._frame_count} ready`);
    this._frame_count++;
    //console.info(`${performance.now()}: frameReady ${frame.timestamp}`);
    const timestamp = frame.timestamp;
    //this._canvasCtx.drawImage(frame,0,0);
    //this._canvasCtx
    //frameCopy = this._canvas.transferToImageBitmap(); //GPU copy of frame
    //frame.close();
    //console.info(`DRAW ${frame.timestamp} TOOK ${performance.now()-start} ms`);


    if (this._playing == true)
    {      
      if (this._playing == true)
      {
        //console.info(`${performance.now()}: Sending ${this._ready_frames.length}`);
        postMessage({"type": "frame",  
                    "data": frame},
                    [frame]
                    ); // transfer frame copy to primary UI thread
        this._ready_frames=[];
        this._transfers=[];
      }
    }
    else
    {
  
    }
  }

  _frameError(error)
  {
    console.warn(`${this._name} DECODE ERROR ${error}`);
    postMessage({"type": "error",
                 "message": error});
  }

  // Set the current video time
  //
  // Timing considerations:
  // - This will either grab from pre-decoded frames and run very quickly or
  //   jump to the nearest preceding keyframe and decode new frames (slightly slower)
  _setCurrentTime(video_time, informational)
  {
    this._current_cursor = video_time;

    let keyframe_info = this._keyframes.closest_keyframe(video_time*this._timescale);
    // Only parse MP4 if we have to
    if (informational == false)
    {
      // If the codec closed on us, opportunistically reopen it
      if (this._videoDecoder.state == 'closed')
      {
        this._videoDecoder = new VideoDecoder({
          output: this._frameReady.bind(this),
          error: this._frameError.bind(this)});
        
      }
      this._videoDecoder.reset();
      this._videoDecoder.configure(this._codecConfig);
      let nearest_keyframe = keyframe_info.thisSegment;
      this._mp4File.stop();
      //console.info(`${performance.now()}: COMMANDING MP4 SEEK ${video_time}`);
      this._mp4File.seek(nearest_keyframe/this._timescale);
      this._mp4File.start();
    }
  }

  // Append data to the mp4 file
  // - This data should either be sequentially added or added on a segment boundary
  // - Prior to adding video segments the mp4 header must be supplied first.
  _appendBuffer(data)
  {
    this._mp4File.appendBuffer(data);
  }
}

///////////////////////////////////////
/// Web Worker Interface
///////////////////////////////////////
var ref = null;
onmessage = function(e)
{
  const msg = e.data;
  if (msg.type == "init")
  {
    const random = Math.random();
    ref = new TatorVideoBuffer(msg.name);
  }
  else if (msg.type == "appendBuffer")
  {
    msg.data.fileStart = msg.fileStart;
    ref._appendBuffer(msg.data);
  }
  else if (msg.type == "currentTime")
  {
    ref._setCurrentTime(msg.currentTime, msg.informational);
  }
  else if (msg.type == "hotFrames")
  {
    ref._hot_frame_keys = msg.hotFrames;
  }
  else if (msg.type == "pause")
  {
    ref.pause();
  }
  else if (msg.type == "play")
  {
    ref.play();
  }
}