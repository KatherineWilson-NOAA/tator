importScripts("/static/js/util/fetch-retry.js");

class VideoDownloader
{
  constructor(media_files, blockSize, offsite_config)
  {
    this._media_files = media_files;
    this._blockSize = blockSize;
    this._offsite_config = offsite_config;
    this._headers = {};
    if (this._offsite_config && this._offsite_config.method)
    {
      const auth_str = `${this._offsite_config.method} ${this._offsite_config.value}`;
      this._headers["Authorization"] = auth_str;
    }
    this._num_res = media_files.length;
    this._currentPacket=[];
    this._numPackets=[];
    this._info=[]; // This will contain the segment information of the video
    this._initialSent = false;

    // The downloader is able to handle downloading multiple media files
    // (e.g. the different streaming options for a given file.)
    for (var idx = 0; idx < this._num_res; idx++)
    {
      this._currentPacket[idx] = 0;
      this._numPackets[idx] = 0;
    }

    // In addition, the downloader can also handle on demand downloading for a media file
    this._onDemandConfig = null;

    // These buffers will store the download requests that occur while the downloader
    // is in onDemand mode
    this._bufferedSegmentDownloads = [];
    this._bufferedSeeks = null;

    // Used with the initial download to get the initial set of frames quicker to the player
    // (assuming that blockSize is large than this)
    this._startUpBlockSize = 1024 * 1024

    this.initializeInfoObjects();
  }

  initializeInfoObjects()
  {
    let init_promises = [];
    for (let buf_idx = 0; buf_idx < this._media_files.length; buf_idx++)
    {
      let info_url = this._media_files[buf_idx].segment_info;
      const info = new Request(info_url, {headers:this._headers});
      init_promises.push(fetch(info));
    }
    Promise.all(init_promises).then((responses) => {
      for (let buf_idx = 0; buf_idx < responses.length; buf_idx++)
      {
        this.processInitResponses(buf_idx,responses[buf_idx]);
      }
    });
  }

  processInitResponses(buf_idx,info)
  {
    var that = this;
    if (info.status == 200)
    {
      console.log("Fetched info");
      info.json().then(data => {
        that._info[buf_idx] = data
        that._numPackets[buf_idx]=data["segments"].length

        console.log(`...${that._numPackets[buf_idx]} segments for buffer ${buf_idx}`)

        var version = 1;
        try
        {
          version = data["file"]["version"];
        }
        catch(error)
        {

        }
        var startBias = 0.0;
        if ('file' in data)
        {
          startBias = data.file.start;
        }
        postMessage({"type": "ready",
                     "startBias": startBias,
                     "version": version,
                     "buf_idx": buf_idx});
      });
    }
    else
    {
      postMessage({"type": "error", "status": info.status});
      console.warn(`Couldn't fetch '${info.url}'`);
    }
  }

  verifyInitialDownload()
  {
    if (this._initialSent == true)
    {
      return true;
    }
    for (let buf_idx = 0; buf_idx < this._media_files.length; buf_idx++)
    {
      // Download the initial fragment info into each buffer
      this.downloadNextSegment(buf_idx, 2);
    }
    this._initialSent = true;
    return false;
  }

  /**
   * Initializes the onDemand downlaoding feature.
   * This also resets the internal on-demand downloading.
   *
   * @param {string} direction - 'forward'|'backward'
   * @param {integer} frame - Frame number to start downloading from
   * @param {integer} mediaFileIndex - Index of media file list from constructor to use
   */
  setupOnDemandDownload(direction, frame, mediaFileIndex)
  {
    this._onDemandConfig = {};
    this._onDemandConfig["direction"] = direction;
    this._onDemandConfig["frame"] = frame;
    this._onDemandConfig["mediaFileIndex"] = mediaFileIndex;
    this._onDemandConfig["currentPacket"] = 0;
    this._onDemandConfig["numPacketsDownloaded"] = 0;
    this._onDemandConfig["videoInfoDownloaded"] = false;
    this._onDemandConfig["lastStartByte"] = -1;

    postMessage({"type": "onDemandInit"});
  }

  /**
   * @returns {boolean} True if in onDemand mode. False otherwise.
   */
  inOnDemandMode()
  {
    return this._onDemandConfig != null;
  }

  /**
   * Save the download next segment request
   * @param {integer} buf_idx - Index of media file list (ie mediaFileIndex)
   */
  saveDownloadNextSegmentRequest(buf_idx)
  {
    this._bufferedSegmentDownloads.push(buf_idx);
  }

  /**
   * Save the download seek request.
   * This will only save a single seek request
   *
   * @param {integer} buf_idx - Index of media file list (ie mediaFileIndex)
   * @param {integer} frame - Frame to seek to
   * @param {float} time - Seek target time in seconds
   */
  saveSeekRequest(buf_idx, frame, time)
  {
    this._bufferedSeek = {"buf_idx": buf_idx, "frame": frame, "time": time};
  }

  /**
   * Shutdown the onDemand downloading.
   * Restart requested downloads (seek first, then segments)
   * Allow downloads to go through.
   */
  shutdownOnDemandDownload()
  {
    this._onDemandConfig = null;

    if (this._bufferedSeek != null)
    {
      this.downloadForFrame(
          this._bufferedSeek["buf_idx"],
          this._bufferedSeek["frame"],
          this._bufferedSeek["time"])
    }

    while (this._bufferedSegmentDownloads.length > 0)
    {
      var buf_idx = this._bufferedSegmentDownloads.shift();
      this.downloadNextSegment(buf_idx);
    }
  }

  /**
   * Returns the segment index for the given media/frame
   * Boundary is true if the frame is within 5 frames of the edge of the segment
   * matchIdx will return with -1 if no segment match is found
   *
   * Important to note this will return the last packet
   * @param {integer} frame - Target frame to search for
   * @param {integer} buf_idx - Index of media file list (ie mediaFileIndex elsewhere)
   * @returns {object} matchIdx, boundary, lastPacket
   */
  getSegmentIndex(frame, buf_idx)
  {
    var matchIdx = -1;
    var boundary = false;

    // Check version of media. If it doesn't match
    var version = 1;
    try
    {
      version = this._info[buf_idx]["file"]["version"];
    }
    catch(error)
    {

    }
    if (version < 2 || version == undefined)
    {
      console.warn("Old version of segment file doesn't support seek operation");
      return {matchIdx, boundary};
    }

    var lastPacket = 0;
    var lastFrame = 0;
    for (var idx = 0; idx < this._numPackets[buf_idx]; idx++)
    {
      if (this._info[buf_idx]["segments"][idx]["name"] == "moof")
      {
        var frame_start = parseInt(this._info[buf_idx]["segments"][idx]["frame_start"]);
        var frame_samples = parseInt(this._info[buf_idx]["segments"][idx]["frame_samples"]);
        lastPacket = idx;
        var frame_end = frame_start + frame_samples;

        if (lastFrame < frame_end)
        {
          lastFrame = frame_end;
        }
        
        if (frame >= frame_start && frame < frame_end)
        {
          matchIdx = idx;
          if (frame - frame_start > frame_samples - 5)
          {
            boundary = true;
          }
          break;
        }
        else if (idx == 2 && frame < frame_start)
        {
          // Handle beginning of videos
          matchIdx = idx;
        }
      }
    }

    return {matchIdx, boundary, lastPacket, lastFrame};
  }

  /**
   * Downloads the next block of video using the initialized blockSize
   * setupOnDemandDownload must have been called prior to running this function.
   *
   * @emits message Message is emitted with the follo
   */
  downloadNextOnDemandBlock()
  {
    var currentSize = 0;
    var packetIndex = this._onDemandConfig["currentPacket"];
    var mediaFileIndex = this._onDemandConfig["mediaFileIndex"];
    var offsets = [];  // Stores the segments (aka packets)
    var startByte;
    var iterBlockSize = this._blockSize;

    if (!this._onDemandConfig["videoInfoDownloaded"])
    {
      // Have we initialized yet? If not:
      // 1. Get the first two packets to get the video file information
      // 2. Set the current packet based on the play start frame

      // Setup getting the file info
      packetIndex = 0;
      startByte = 0;
      while (
        currentSize < iterBlockSize &&
        packetIndex < this._numPackets[mediaFileIndex] &&
        offsets.length < 2)
      {
        const packet = this._info[mediaFileIndex]["segments"][packetIndex];
        const pos = parseInt(packet["offset"]);
        const size = parseInt(packet["size"]);
        offsets.push([pos - startByte, size, packet["name"]]);
        currentSize = pos + size - startByte;
        packetIndex++;
      }

      // Set the current packet based on the play start frame plus some wiggle room
      var frameToStart = 0;
      if (this._onDemandConfig["direction"] == "forward")
      {
        frameToStart = this._onDemandConfig["frame"] - 100;  
        if (frameToStart < 0)
        {
          frameToStart = 0;
        }
      }
      else
      {
        frameToStart = this._onDemandConfig["frame"] + 100;
      }
      let {matchIdx, boundary, lastPacket, lastFrame} = this.getSegmentIndex(frameToStart, mediaFileIndex);
      if (this._onDemandConfig["direction"] == "backward")
      {
        if (frameToStart > lastFrame)
        {
          matchIdx = lastPacket;
        }
      }
      if (matchIdx == -1)
      {
        console.warn(`Couldn't fetch onDemand video for (${this._onDemandConfig["frame"]})`)
        return;
      }
      packetIndex = matchIdx;
      this.downloadInit = true;
    }
    else
    {
      // Establish the size of downloads
      // First set of segments will be downloaded more quickly (smaller chunks)
      this.downloadInit = false;
      if (this._onDemandConfig["numPacketsDownloaded"] < 20)
      {
        iterBlockSize = this._startUpBlockSize;
      }

      // Determine the startByte for this block of data to download
      // Download range based on the block size and the direction
      if (this._onDemandConfig["direction"] == "forward")
      {
        if (packetIndex >= this._numPackets[mediaFileIndex])
        {
          console.log("onDemand playback (forward) reached end of video.");
          postMessage({"type": "onDemandFinished"});
          return;
        }

        // Need to download segments in the forward direction
        startByte = parseInt(this._info[mediaFileIndex]["segments"][packetIndex]["offset"]);

        while (currentSize < iterBlockSize && packetIndex < this._numPackets[mediaFileIndex])
        {
          const packet = this._info[mediaFileIndex]["segments"][packetIndex];
          const pos = parseInt(packet["offset"]);
          const size = parseInt(packet["size"]);
          offsets.push([pos - startByte, size, packet["name"]]);
          currentSize = pos + size - startByte;
          packetIndex++;
        }
      }
      else
      {
        // Need to download segments backwards
        if (packetIndex < 2)
        {
          console.log("onDemand playback (backward) reached the beginning of video.");
          postMessage({"type": "onDemandFinished"});
          return;
        }

        var packetData = [];

        // If we haven't downloaded

        // Move backwards
        while (currentSize < iterBlockSize && packetIndex >= 2)
        {
          const packet = this._info[mediaFileIndex]["segments"][packetIndex];
          const packetStart = parseInt(packet["offset"]);
          const packetSize = parseInt(packet["size"]);

          packetData.push({start: packetStart, size: packetSize, name: packet["name"]})
          currentSize += packetSize;
          packetIndex--;
        }

        // Set the startByte and the offsets now that we have figured out how many segments
        // we need to download
        startByte = parseInt(this._info[mediaFileIndex]["segments"][packetIndex + 1]["offset"]);

        // Not sure if it's necessary to reverse for loop
        for (var idx = packetData.length - 1; idx >= 0; idx--)
        {
          const packet = packetData[idx];
          offsets.push([packet.start - startByte, packet.size, packet.name]);
        }

        if (this._onDemandConfig["lastStartByte"] > 0)
        {
          currentSize = this._onDemandConfig["lastStartByte"] - startByte;
        }
      }

      this._onDemandConfig["numPacketsDownloaded"] += offsets.length;
    }

    this._onDemandConfig["currentPacket"] = packetIndex;
    this._onDemandConfig["lastStartByte"] = startByte;
    var downloadSize = currentSize - 1;

    console.log(`onDemand downloading '${downloadSize}' at '${startByte}' (next segment idx - ${packetIndex})`);

    let headers = {'range':`bytes=${startByte}-${startByte+downloadSize}`,
                   ...self._headers};

    var that = this;
    fetch(this._media_files[mediaFileIndex].path,
          {headers: headers}
         ).then(
          (response) =>
            {
              response.arrayBuffer().then(
                (buffer) =>
                {
                  if (that.downloadInit)
                  {
                    that._onDemandConfig["videoInfoDownloaded"] = true;
                  }

                  var data={"type": "onDemand",
                           "buf_idx" : mediaFileIndex,
                           "offsets": offsets,
                           "buffer": buffer};
                  postMessage(data, [data.buffer]);
                });
            });
  }

  downloadForFrame(buf_idx, frame, time)
  {
    var version = 1;
    try
    {
      version = this._info[buf_idx]["file"]["version"];
    }
    catch(error)
    {

    }
    if (version < 2 || version == undefined)
    {
      console.warn("Old version of segment file doesn't support seek operation");
      return;
    }
    var matchIdx = -1;
    var boundary = false;
    for (var idx = 0; idx < this._numPackets[buf_idx]; idx++)
    {
      if (this._info[buf_idx]["segments"][idx]["name"] == "moof")
      {
        var frame_start = parseInt(this._info[buf_idx]["segments"][idx]["frame_start"]);
        var frame_samples = parseInt(this._info[buf_idx]["segments"][idx]["frame_samples"]);
        if (frame >= frame_start && frame < frame_start+frame_samples)
        {
          matchIdx = idx;
          if (frame - frame_start > frame_samples-5)
          {
            boundary = true;
          }
          break;
        }
        else if (idx == 2 && frame < frame_start)
        {
          // Handle beginning of videos
          matchIdx = idx;
        }
      }
    }

    // No match
    if (matchIdx == -1)
    {
      console.warn(`Couldn't fetch video for ${time}(${frame})`)
      return;
    }

    // Calculate which section of the file to get, default
    // is the segment (moof+mdat)
    let start = matchIdx;
    let end = matchIdx + 1;

    // If we are at a boundary get the next segment
    if (boundary == true)
    {
      end = Math.min(matchIdx + 3, this._numPackets[buf_idx]-1);
    }

    const start_packet = this._info[buf_idx]["segments"][matchIdx];
    var startByte = parseInt(start_packet["offset"]);
    var offset = 0;

    // Add up the size of any included packets
    for (let idx = matchIdx; idx <= end; idx++)
    {
      offset += this._info[buf_idx]["segments"][idx]["size"];
    }

    let headers = {'range':`bytes=${startByte}-${startByte+offset-1}`,
                   ...self._headers};
    fetchRetry(this._media_files[buf_idx].path,
          {headers: headers}
         ).then(
           function(response)
           {
             response.arrayBuffer().then(
               function(buffer)
               {
                 // Transfer the buffer to the
                 var data={"type": "seek_result",
                           "time": time,
                           "buffer": buffer,
                           "frame": frame};
                 postMessage(data, [data.buffer]);
               });
           });

  }

  downloadNextSegment(buf_idx, packet_limit)
  {
    var currentSize=0;
    var idx = this._currentPacket[buf_idx];

    // Temp code one can use to force network seeking
    //if (idx > 0)
    // {
    //  console.log("Force seeking to test it out");
    //  postMessage({"type": "finished"});
    //  return;
    // }

    if (packet_limit == undefined)
    {
      packet_limit = Infinity;
    }

    if (idx >= this._numPackets[buf_idx])
    {
      console.log("Done downloading..");
      postMessage({"type": "finished"});
      return;
    }

    var startByte=parseInt(this._info[buf_idx]["segments"][idx]["offset"]);
    if (idx == 0)
    {
      startByte = 0;
    }

    // Use 1 Mb blocks if in the first 5 packets
    var iterBlockSize=this._blockSize;
    if (idx < 5)
    {
        iterBlockSize=1024*1024;
    }
    var offsets=[];
    while (currentSize < iterBlockSize && idx < this._numPackets[buf_idx] && offsets.length < packet_limit)
    {
      const packet = this._info[buf_idx]["segments"][idx];
      const pos=parseInt(packet["offset"]);
      const size=parseInt(packet["size"]);
      offsets.push([pos-startByte,size, packet["name"]]);
      currentSize=pos+size-startByte;
      idx++;
    }

    //console.log(`Downloading '${currentSize}' at '${startByte}' (${idx})`);
    this._currentPacket[buf_idx] = idx;
    var percent_complete=idx/this._numPackets[buf_idx];
    let headers = {'range':`bytes=${startByte}-${startByte+currentSize-1}`,
                   ...self._headers};
    fetch(this._media_files[buf_idx].path,
          {headers: headers}
         ).then(
           (response) =>
           {
             response.arrayBuffer().then(
               (buffer) =>
               {
                 // Transfer the buffer to the
                 var data={"type": "buffer",
                           "buf_idx" : buf_idx,
                           "pts_start": 0,
                           "pts_end": 0,
                           "percent_complete": percent_complete,
                           "offsets": offsets,
                           "buffer": buffer};
                 postMessage(data, [data.buffer]);
               });
           });
  }
}

var ref = null;
onmessage = function(e)
{
  msg = e.data;
  var type = msg['type'];
  if (type == 'start')
  {
    if (ref == null)
    {
      ref = new VideoDownloader(msg.media_files,
                                5*1024*1024, // Download in 5 MB chunks
                                msg.offsite_config);
    }
  }
  else if (type == 'download')
  {
    if (ref.verifyInitialDownload() == true)
    {
      if (ref.inOnDemandMode())
      {
        ref.saveDownloadNextSegmentRequest(msg.buf_idx);
      }
      else
      {
        ref.downloadNextSegment(msg.buf_idx);
      }
    }
  }
  else if (type == 'seek')
  {
    if (ref.inOnDemandMode())
    {
      ref.saveSeekRequest(msg.buf_idx, msg['frame'], msg['time'])
    }
    else
    {
      ref.downloadForFrame(msg.buf_idx, msg['frame'], msg['time']);
    }
  }
  else if (type == 'onDemandInit')
  {
    ref.setupOnDemandDownload(msg['direction'], msg['frame'], msg['mediaFileIndex']);
  }
  else if (type == 'onDemandDownload')
  {
    if (ref.inOnDemandMode())
    {
      ref.downloadNextOnDemandBlock();
    }
  }
  else if (type == 'onDemandShutdown')
  {
    ref.shutdownOnDemandDownload();
  }
}
