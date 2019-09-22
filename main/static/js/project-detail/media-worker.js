importScripts("/static/js/util/fetch-retry.js");

self.addEventListener("message", async evt => {
  const msg = evt.data;
  if (msg.command == "processUpdate") {
    // New process update from websocket
  } else if (msg.command == "sectionInView") {
    // Section moved into or out of view
  } else if (msg.command == "sectionPage") {
    // Section changed pages
    const section = self.sections.get(msg.section);
    section.setPage(msg.start, msg.stop);
  } else if (msg.command == "sectionFilter") {
    // Applies filter to section
  } else if (msg.command == "projectFilter") {
    // Applies filter to whole project
  } else if (msg.command == "init") {
    // Sets token, project.
    self.projectId = msg.projectId;
    self.headers = {
      "Authorization": "Token " + msg.token,
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
    const url = "/rest/EntityMedias/" + msg.projectId +
      "?operation=attribute_count::tator_user_sections";
    fetchRetry(url, {
      method: "GET",
      credentials: "omit",
      headers: self.headers,
    })
    .then(response => response.json())
    .then(data => setupSections(data))
    .catch(err => console.log("Error initializing web worker: " + err));
  }
});

class SectionData {
  constructor(name, numMedia) {
    // Section name.
    this._name = name;
    
    // Map of UIDs to process objects.
    this._processById = new Map();

    // Sorted list of process UIDs.
    this._sortedIds = [];

    // Sorted list of process progress.
    this._sortedProgress = [];

    // Map of media ID to media, sorted by REST API.
    this._mediaById = new Map();

    // List of media IDs.
    this._mediaIds = [];

    // Map of media ID to processed media, populated upon process completion.
    this._processedMediaById = new Map();

    // Number of media
    this._numMedia = numMedia;

    // Whether this section is high priority
    this._priority = false;

    // Start index of current page.
    this._start = 0;

    // Stop index of current page.
    this._stop = 6;
  }

  fetchMedia() {
    // Fetches next batch of data
    const start = this._mediaById.size;
    if (start < this._stop) {
      const url = "/rest/EntityMedias/" + self.projectId +
        "?start=" + start + "&stop=" + this._stop;
      fetchRetry(url, {
        method: "GET",
        credentials: "omit",
        headers: self.headers,
      })
      .then(response => response.json())
      .then(data => {
        for (const media of data) {
          this._mediaById.set(media.id, media);
          this._mediaIds.push(media.id);
        }
        this._emitUpdate();
      })
      .catch(err => console.error("Error retrieving media info: " + err));
    } else {
      this._emitUpdate();
    }
  }

  setPage(start, stop) {
    this._start = start;
    this._stop = stop;
    this.fetchMedia();
  }

  updateProcess(process) {
    // Updates an existing process or adds a new one
    this._processById.set(process.uid, process);
    const currentIndex = this._sortedIds.indexOf(process.uid);
    const currentInRange = currentIndex >= this._start && currentIndex < this._stop;
    if (currentIndex > -1) {
      this._sortedIds.splice(currentIndex, 1);
      this._sortedProgress.splice(currentIndex, 1);
    }
    const sortedIndex = findSortedIndex(this._sortedProgress, process.percent);
    this._sortedIds.splice(sortedIndex, 0, process.uid);
    this._sortedProgress.splice(sortedIndex, 0, process.percent);
    const sortedInRange = sortedIndex >= this._start && sortedIndex < this._stop;
    if (currentInRange || sortedInRange) {
      this._emitUpdate();
    }
  }

  _emitUpdate() {
    const numProc = this._processById.size;
    const stop = Math.min(numProc, this._stop);
    const procIds = this._sortedIds.slice(this._start, stop);
    const procs = Array.from(
      procIds,
      procId => this._processById.get(procId)
    );
    const start = Math.max(numProc, this._start);
    const mediaIds = this._mediaIds.slice(start, this._stop);
    const media = Array.from(
      mediaIds,
      mediaId => this._mediaById.get(mediaId)
    );
    self.postMessage({
      command: "updateSection",
      name: this._name,
      data: procs.concat(media),
    });
  }
}

function setupSections(sectionCounts) {
  self.postMessage({
    command: "setupSections",
    data: sectionCounts,
  });
  self.sections = new Map();
  for (const section in sectionCounts) {
    const data = new SectionData(section, sectionCounts[section]);
    self.sections.set(section, data);
  }
}

function findSortedIndex(arr, val) {
  let low = 0;
  let high = arr.length;
  while (low < high) {
    const mid = low + high >>> 1;
    if (arr[mid] < val) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}

