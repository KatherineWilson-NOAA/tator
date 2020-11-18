class SaveDialog extends TatorElement {
  constructor() {
    super();

    this._div = document.createElement("div");
    this._div.setAttribute("class", "annotation__panel--popup annotation__panel px-4 rounded-2");
    this._div.style.zIndex = 3;
    this._shadow.appendChild(this._div);

    const header = document.createElement("div");
    header.setAttribute("class", "d-flex flex-items-center flex-justify-between py-3");
    this._div.appendChild(header);

    this._span = document.createElement("span");
    this._span.setAttribute("class", "text-semibold");
    header.appendChild(this._span);

    this._attributes = document.createElement("attribute-panel");
    this._div.appendChild(this._attributes);

    const favesDiv = document.createElement("div");
    favesDiv.setAttribute("class", "annotation__panel-group py-2 text-gray f2");
    this._div.appendChild(favesDiv);

    this._favorites = document.createElement("favorites-panel");
    favesDiv.appendChild(this._favorites);

    const buttons = document.createElement("div");
    buttons.setAttribute("class", "d-flex flex-items-center py-4");
    this._div.appendChild(buttons);

    this._save = document.createElement("button");
    this._save.setAttribute("class", "btn btn-clear");
    this._save.setAttribute("disabled", "");
    this._save.textContent = "Save";
    buttons.appendChild(this._save);

    const cancel = document.createElement("button");
    cancel.setAttribute("class", "btn-clear px-4 text-gray hover-text-white");
    cancel.textContent = "Cancel";
    buttons.appendChild(cancel);

    this._attributes.addEventListener("change", () => {
      this._values = this._attributes.getValues();
      if (this._values === null) {
        this._save.setAttribute("disabled", "");
      } else {
        this._save.removeAttribute("disabled");
      }
    });

    this._favorites.addEventListener("load", evt => {
      this._attributes.setValues({attributes: evt.detail});
    });

    this._favorites.addEventListener("store", evt => {
      this._favorites.store(this._values);
    });

    this._save.addEventListener("click", () => {
      this._values = this._attributes.getValues();
      this.saveObject(this._requestObj, this._values)
      if (this._metaMode)
      {
        // Update the meta cache
        this._metaCache = Object.assign({},this._values)
      }
      this._attributes.reset();
    });

    cancel.addEventListener("click", () => {
      this.dispatchEvent(new Event("cancel"));
      this._attributes.reset();
    });
  }

  init(projectId, mediaId, dataType, undo, version, favorites) {

    this._projectId = projectId;
    this._mediaId = mediaId;
    this._dataType = dataType;
    this._undo = undo;
    this._version = version;
    this._span.textContent = dataType.name;
    this._attributes.dataType = dataType;
    this._favorites.init(dataType, favorites);

    // For the save dialog, the track search bar doesn't need to be shown.
    // The user only needs to modify the attributes in the dialog window.
    this._attributes.displaySlider(false);

    this._attributes.dispatchEvent(new Event("change"));
  }

  set stateMediaIds(val) {
    this._stateMediaIds = val;
  }

  // Save the underlying object to the database
  saveObject(requestObj, values)
  {
    // Defensively program against null attribute values
    if (values == undefined || values == null)
    {
      values = {};
    }

    this.dispatchEvent(new CustomEvent("save", {
      detail: values
    }));
    var body = {
      type: Number(this._dataType.id.split("_")[1]),
      name: this._dataType.name,
      version: this._version.id,
      ...requestObj,
      ...values,
    };

    if (this._dataType.dtype.includes("state")) {
      if (this._stateMediaIds) {
        body.media_ids = this._stateMediaIds;
      }
      else {
        body.media_ids = [this._mediaId];
      }
      this._undo.post("States", body, this._dataType);
    }
    else {
      body.media_id = this._mediaId
      this._undo.post("Localizations", body, this._dataType);
    }
  }

  set version(val) {
    this._version = val;
  }

  set canvasPosition(val) {
    this._canvasPosition = val;
    this._updatePosition();
  }

  set dragInfo(val) {
    this._dragInfo = val;
    this._updatePosition();
  }

  set metaMode(val) {
    this._metaMode = val;
    if (val == false)
    {
      this._metaCache = null;
    }
  }

  get metaMode() {
    return this._metaMode;
  }

  get metaCache() {
    return this._metaCache;
  }

  set requestObj(val) {
    this._requestObj = val;
  }

  addRecent(val) {
    this._recent.add(val);
  }

  _updatePosition() {
    const dragDefined = typeof this._dragInfo !== "undefined";
    const canvasDefined = typeof this._canvasPosition !== "undefined";
    if (dragDefined && canvasDefined) {
      const boxTop = Math.min(this._dragInfo.start.y, this._dragInfo.end.y) - 2;
      const boxRight = Math.max(this._dragInfo.start.x, this._dragInfo.end.x);
      let thisTop = boxTop + this._canvasPosition.top;
      let thisLeft = boxRight + 20 + this._canvasPosition.left;
      if ((thisLeft + this.clientWidth) > window.innerWidth) {
        const boxLeft = Math.min(this._dragInfo.start.x, this._dragInfo.end.x);
        thisLeft = boxLeft - 20 - this.clientWidth + this._canvasPosition.left;
      }
      if ((thisTop + this.clientHeight) > window.innerHeight) {
        const boxBottom = Math.max(this._dragInfo.start.y, this._dragInfo.end.y) + 2;
        thisTop = boxBottom - this.clientHeight + this._canvasPosition.top + 16;
      }
      // Prevent being drawn off screen
      thisTop = Math.max(thisTop, 50);
      thisLeft = Math.max(thisLeft, 50);
      this.style.top = thisTop + "px";
      this.style.left = thisLeft + "px";
    }
  }
}

customElements.define("save-dialog", SaveDialog);
