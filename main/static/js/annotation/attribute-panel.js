class AttributePanel extends TatorElement {
  constructor() {
    super();

    this._div = document.createElement("div");
    this._div.setAttribute("class", "annotation__panel-group py-2 text-gray f2");
    this._shadow.appendChild(this._div);
    this._emitChanges=true;

    this._idWidget = document.createElement("text-input");
    this._idWidget.permission = "View Only";
    this._idWidget.setAttribute("name", "ID");
    this._div.appendChild(this._idWidget);

    this._createdByWidget = document.createElement("text-input");
    this._createdByWidget.permission = "View Only";
    this._createdByWidget.setAttribute("name", "Created By");
    this._div.appendChild(this._createdByWidget);

    this._builtInAttrLabel = document.createElement("div");
    this._builtInAttrLabel.setAttribute("class", "f2 text-gray clickable py-2");
    this._builtInAttrLabel.textContent = "Built-in Attributes";
    this._shadow.appendChild(this._builtInAttrLabel);

    this._builtInAttrsDiv = document.createElement("div");
    this._builtInAttrsDiv.setAttribute("class", "annotation__panel-group py-2 text-gray f2");
    this._shadow.appendChild(this._builtInAttrsDiv);

    this._builtInAttrLabel.appendChild(this._chevron());
    this._builtInAttrLabel.addEventListener("click", evt => {
      this._toggleAttributes(this._builtInAttrsDiv);
      this._toggleChevron(evt);
    });

    this._hiddenAttrLabel = document.createElement("div");
    this._hiddenAttrLabel.setAttribute("class", "f2 text-gray clickable py-2");
    this._hiddenAttrLabel.textContent = "Hidden Attributes";
    this._shadow.appendChild(this._hiddenAttrLabel);

    this._hiddenAttrsDiv = document.createElement("div");
    this._hiddenAttrsDiv.setAttribute("class", "annotation__panel-group py-2 text-gray f2");
    this._shadow.appendChild(this._hiddenAttrsDiv);

    this._hiddenAttrLabel.appendChild(this._chevron());
    this._hiddenAttrLabel.addEventListener("click", evt => {
      this._toggleAttributes(this._hiddenAttrsDiv);
      this._toggleChevron(evt);
    });

    // #TODO refactor this to tator-data
    this._userList = [];
    this._versionList = [];
  }

  static get observedAttributes() {
    return ["in-entity-browser"];
  }

  _chevron() {
    const chevron = document.createElementNS(svgNamespace, "svg");
    chevron.setAttribute("class", "chevron");
    chevron.setAttribute("viewBox", "0 0 24 24");
    chevron.setAttribute("height", "1em");
    chevron.setAttribute("width", "1em");

    const chevronPath = document.createElementNS(svgNamespace, "path");
    chevronPath.setAttribute("d", "M9.707 18.707l6-6c0.391-0.391 0.391-1.024 0-1.414l-6-6c-0.391-0.391-1.024-0.391-1.414 0s-0.391 1.024 0 1.414l5.293 5.293-5.293 5.293c-0.391 0.391-0.391 1.024 0 1.414s1.024 0.391 1.414 0z");

    chevron.appendChild(chevronPath);

    return chevron;
  }

  _toggleChevron(evt){
    var el = evt.target;
    return el.classList.toggle('chevron-trigger-90');
  }

  _toggleAttributes(el){
    let hidden = el.hidden
    return el.hidden = !hidden;
  };

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "in-entity-browser":
        this._div.classList.add("px-4");
    }
  }

  set permission(val) {
    this._permission = val;
    for (const widget of this._div.children) {
      // Specific attribute fields in this panel are always disabled
      if (widget.getAttribute("name") != "ID" && widget.getAttribute("name") != "Created By") {
        // Widget may have been marked as disabled, and its permission have already been
        // set appropriately.
        if (!widget.disabled) {
          widget.permission = val;
        }
      }
    }
  }

  /**
   * @param {Tator.Media} media - Media associated with localization. Optional and only useful
   *                              with the built in attributes.
   */
  set associatedMedia(media) {
    this._associatedMedia = media;
  }

  /**
   * Adds the fields common across all localization and state types
   */
  _addCommonBuiltInAttributes() {

    var widget;

    widget = document.createElement("text-input");
    widget.setAttribute("name", "Frame");
    widget.permission = "View Only";
    this._builtInAttrsDiv.appendChild(widget);

    widget = document.createElement("text-input");
    widget.setAttribute("name", "Type");
    widget.permission = "View Only";
    this._builtInAttrsDiv.appendChild(widget);

    widget = document.createElement("text-input");
    widget.setAttribute("name", "Version");
    widget.permission = "View Only";
    this._builtInAttrsDiv.appendChild(widget);

    widget = document.createElement("text-input");
    widget.setAttribute("name", "Created Datetime");
    widget.permission = "View Only";
    this._builtInAttrsDiv.appendChild(widget);

    widget = document.createElement("text-input");
    widget.setAttribute("name", "Modified By");
    widget.permission = "View Only";
    this._builtInAttrsDiv.appendChild(widget);

    widget = document.createElement("text-input");
    widget.setAttribute("name", "Modified Datetime");
    widget.permission = "View Only";
    this._builtInAttrsDiv.appendChild(widget);
  }

  _setBuiltInAttributes(values) {
    for (const widget of this._builtInAttrsDiv.children) {
      const name = widget.getAttribute("name");

      if (name == "Frame") {
        widget.setValue(values.frame);
      }
      else if (name == "Type") {
        widget.setValue(values.meta);
      }
      else if (name == "Version") {

        let version = null;
        let foundVersion = false;
        for (let index = 0; index < this._versionList.length; index++) {
          if (this._versionList[index].id == values.modified_by) {
            foundVersion = true;
            username = this._versionList[index].result.name;
            break;
          }
        }

        if (!foundVersion) {
          this._getVersion(values.version, widget);
        }
        else {
          widget.setValue(version);
        }
      }
      else if (name == "Created Datetime") {
        widget.setValue(values.created_datetime);
      }
      else if (name == "Modified By") {

        let username = null;
        let foundUser = false;
        for (let index = 0; index < this._userList.length; index++) {
          if (this._userList[index].id == values.modified_by) {
            foundUser = true;
            username = this._userList[index].result.username;
            break;
          }
        }

        if (!foundUser) {
          this._getUsername(values.modified_by, widget);
        }
        else {
          widget.setValue(username);
        }
      }
      else if (name == "Modified Datetime") {
        widget.setValue(values.modified_datetime);
      }
      else if (name == "x") {
        let val = `${values.x.toFixed(4)}`;
        if (this._associatedMedia) {
          val += ` | ${Math.round(values.x*this._associatedMedia.width)} px`;
        }
        widget.setValue(val);
      }
      else if (name == "y") {
        let val = `${values.y.toFixed(4)}`;
        if (this._associatedMedia) {
          val += ` | ${Math.round(values.y*this._associatedMedia.height)} px`;
        }
        widget.setValue(val);
      }
      else if (name == "u") {
        let val = `${values.u.toFixed(4)}`;
        if (this._associatedMedia) {
          val += ` | ${Math.round(values.u*this._associatedMedia.width)} px`;
        }
        widget.setValue(val);
      }
      else if (name == "v") {
        let val = `${values.v.toFixed(4)}`;
        if (this._associatedMedia) {
          val += ` | ${Math.round(values.v*this._associatedMedia.height)} px`;
        }
        widget.setValue(val);
      }
      else if (name == "width") {
        let val = `${values.width.toFixed(4)}`;
        if (this._associatedMedia) {
          val += ` | ${Math.round(values.width*this._associatedMedia.width)} px`;
        }
        widget.setValue(val);
      }
      else if (name == "height") {
        let val = `${values.height.toFixed(4)}`;
        if (this._associatedMedia) {
          val += ` | ${Math.round(values.height*this._associatedMedia.height)} px`;
        }
        widget.setValue(val);
      }
    }
  }

  _setHiddenAttributes(values) {
    for (const widget of this._hiddenAttrsDiv.children) {
      const name = widget.getAttribute("name");
      const value = values.attributes[name];
      // Only set the name if it is defined
      if (value != undefined) {
        widget.setValue(values.attributes[name]);
      }
    }
  }

  _removeBuiltInAttributes() {
    while (this._builtInAttrsDiv.children.length > 0) {
      this._builtInAttrsDiv.removeChild(this._builtInAttrsDiv.lastChild);
    }
  }

  _removeHiddenAttributes() {
    while (this._hiddenAttrsDiv.children.length > 0) {
      this._hiddenAttrsDiv.removeChild(this._hiddenAttrsDiv.lastChild);
    }
  }

  set enableBuiltInAttributes(val) {
    this._enableBuiltInAttributes = val;
  }

  set enableHiddenAttributes(val) {
    this._enableHiddenAttributes = val;
  }

  set dataType(val) {
    this._dataType = val;

    // Remove existing attribute widgets.
    while (true) {
      const child = this._div.lastChild;
      if (child === this._idWidget || child === this._createdByWidget) {
        break;
      }
      this._div.removeChild(child);
    }

    this._removeBuiltInAttributes();
    this._removeHiddenAttributes();

    if (val.isTrack) {
      const div = document.createElement("div");
      div.setAttribute("class", "annotation__panel-group px-4 py-3 text-gray f2");
      this._shadow.insertBefore(div, this._div);

      var sliderDiv = document.createElement("div");
      sliderDiv.setAttribute("class", "d-flex flex-items-center flex-justify-between py-1");
      div.appendChild(sliderDiv);

      this._slider = document.createElement("input");
      this._slider.setAttribute("class", "range flex-grow");
      this._slider.setAttribute("type", "range");
      this._slider.setAttribute("step", "1");
      this._slider.setAttribute("value", "0");
      sliderDiv.appendChild(this._slider);

      this._slider.addEventListener("input", () => {
        if (this._emitChanges) {
          this.dispatchEvent(new CustomEvent("frameChange", {
            detail: {frame: this._frames[this._slider.value],
                     track: this._track},
            composed: true
          }));
        }
      });

      this._currentFrame = 0;
    }
    else {
      const div = document.createElement("div");
      div.setAttribute("class", "annotation__panel-group px-4 py-3 text-gray f2");
      this._shadow.insertBefore(div, this._div);

      var goToTrackDiv = document.createElement("div");
      goToTrackDiv.setAttribute("class", "d-flex flex-items-center py-1");
      this._goToTrack = div;
      div.appendChild(goToTrackDiv);

      var label = document.createElement("legend");
      this._goToTrackLabel = label;
      goToTrackDiv.append(label);

      var goToTrackButton = document.createElement("entity-track-button");
      goToTrackButton.style.marginLeft = "16px";
      goToTrackButton.addEventListener("click", () => {
        this.dispatchEvent(new CustomEvent("goToTrack", {
          detail: {track: this._associatedTrack},
          composed: true
        }
        ));
      });
      goToTrackDiv.appendChild(goToTrackButton);
      this.displayGoToTrack(false);
    }

    // Built-in attributes
    if (val.dtype == "box") {
      this._addCommonBuiltInAttributes();

      let widget = document.createElement("text-input");
      widget.setAttribute("name", "x");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);

      widget = document.createElement("text-input");
      widget.setAttribute("name", "y");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);

      widget = document.createElement("text-input");
      widget.setAttribute("name", "width");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);

      widget = document.createElement("text-input");
      widget.setAttribute("name", "height");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);
    }
    else if (val.dtype == "line") {
      this._addCommonBuiltInAttributes();

      let widget = document.createElement("text-input");
      widget.setAttribute("name", "x");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);

      widget = document.createElement("text-input");
      widget.setAttribute("name", "y");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);

      widget = document.createElement("text-input");
      widget.setAttribute("name", "u");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);

      widget = document.createElement("text-input");
      widget.setAttribute("name", "v");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);
    }
    else if (val.dtype == "dot") {
      this._addCommonBuiltInAttributes();

      let widget = document.createElement("text-input");
      widget.setAttribute("name", "x");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);

      widget = document.createElement("text-input");
      widget.setAttribute("name", "y");
      widget.permission = "View Only";
      this._builtInAttrsDiv.appendChild(widget);
   }

    // User defined attributes
    const sorted = val.attribute_types.sort((a, b) => {
      return a.order - b.order || a.name - b.name;
    });
    for (const column of sorted) {
      let widget;
      var ignorePermission = false;

      if (column.dtype == "bool") {
        widget = document.createElement("bool-input");
        widget.setAttribute("name", column.name);
        widget.setAttribute("on-text", "Yes");
        widget.setAttribute("off-text", "No");
      } else if (column.dtype == "enum") {
        widget = document.createElement("enum-input");
        widget.setAttribute("name", column.name);
        let choices = [];
        for (let idx = 0; idx < column.choices.length; idx++)
        {
          let choice = {'value': column.choices[idx]};
          if (column.labels)
          {
            choice.label = column.labels[idx];
          }
          choices.push(choice);
        }
        widget.choices = choices;
      } else if (column.style) {
        const style_options = column.style.split(' ');
        if (column.dtype == "string" && style_options.includes("long_string")) {
          widget = document.createElement("text-area");
          widget.setAttribute("name", column.name);
          widget.setAttribute("type", column.dtype);
        } else {
          widget = document.createElement("text-input");
          widget.setAttribute("name", column.name);
          widget.setAttribute("type", column.dtype);
          widget.autocomplete = column.autocomplete;
        }

        if (style_options.includes("disabled")) {
          widget.permission = "View Only";
          widget.disabled = true;
          ignorePermission = true;
        }
      }
      else {
        // TODO: Implement a better datetime widget
        // TODO: Implement a better geopos widget
        widget = document.createElement("text-input");
        widget.setAttribute("name", column.name);
        widget.setAttribute("type", column.dtype);
        widget.autocomplete = column.autocomplete;
      }

      // Set whether this widget is required
      if (typeof column.required === "undefined") {
        widget.required = false;
      } else {
        widget.required = column.required;
      }

      if (typeof this._permission !== "undefined" && !ignorePermission) {
        widget.permission = this._permission;
      }

      if (column.order < 0) {
        this._hiddenAttrsDiv.appendChild(widget);
      }
      else {
        this._div.appendChild(widget);
      }

      if (column.default) {
        widget.default = column.default;
      }
      widget.reset();

      widget.addEventListener("change", () => {
        if (this._emitChanges) {
          this.dispatchEvent(new Event("change"));
        }
      });
    }

    if (this._enableBuiltInAttributes && this._builtInAttrsDiv.children.length > 0) {
      this._builtInAttrLabel.hidden = false;
      this._builtInAttrsDiv.hidden = true;
    }
    else {
      this._builtInAttrLabel.hidden = true;
      this._builtInAttrsDiv.hidden = true;
    }

    if (this._enableHiddenAttributes && this._hiddenAttrsDiv.children.length > 0) {
      this._hiddenAttrLabel.hidden = false;
      this._hiddenAttrsDiv.hidden = true;
    }
    else {
      this._hiddenAttrLabel.hidden = true;
      this._hiddenAttrsDiv.hidden = true;
    }
  }

  getValues() {
    let values = {};
    for (const widget of this._div.children) {
      if (widget.getAttribute("name") != "ID" && widget.getAttribute("name") != "Created By") {
        const val = widget.getValue();
        if ((val === null) && (widget.required)) {
          values = null;
          break;
        } else if (val !== null) {
          values[widget.getAttribute("name")] = val;
        }
      }
    }
    return values;
  }

  setFrame(frame) {
    this._currentFrame = frame;
    let sliderData = {};
    sliderData.currentFrame = this._currentFrame;
    this.setSlider(sliderData);
  }

  /**
   * @param {boolean} display - True if it's displayed. False to hide it.
   */
  displayGoToTrack(display) {
    if (this._goToTrack) {
      if (display) {
        this._goToTrack.style.display = "block";
      }
      else {
        this._goToTrack.style.display = "none";
      }
    }
  }

  displaySlider(display) {
    if (this._slider){
      if (display) {
        this._slider.style.display = "block";
      }
      else {
        this._slider.style.display = "none";
      }
    }
  }

  setSlider(data) {
    // If there's no slider as a part of this panel, then just ignored this call.
    if (!this._slider){ return; }

    // Set the slider max and corresponding frame index list if
    // the track frame segments are provided (which are start/end pairs)
    if (data.segments){
      this._trackSegments = data.segments;
      this._frames = [];
      for (const [start, end] of data.segments) {
        for (let i = start; i <= end; i++) {
          this._frames.push(i);
        }
      }
      this._slider.max = this._frames.length - 1;
      this._frame_max = Math.max(...this._frames);
    }

    // Set the current value of the slider based on the provided frame
    // If no frame is provided, then just pick the beginning
    if (data.currentFrame && this._frames) {
      let slider_index = this._frames.indexOf(data.currentFrame);

      // Current frame is not part of this track's frameset. Set the slider
      // based on the current frame number by picking the closest entry
      // (without going over)
      if (slider_index == -1) {
        for (let i = 0; i < this._frames.length; i++) {
          if (this._frames[i] <= data.currentFrame) {
            slider_index = i;
          }
        }
      }

      this._slider.value = slider_index;
    }
    else {
      this._slider.value = 0;
    }
  }

  _getUsername(userId, widget) {
    if (userId){
      fetch("/rest/User/" + userId, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      })
      .then(response => { return response.json(); })
      .then(result => {
        this._userList.push({result});
        widget.setValue(result.username);
      });
    }
  }

  _getVersion(versionId, widget) {
    if (versionId){
      fetch("/rest/Version/" + versionId, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      })
      .then(response => { return response.json(); })
      .then(result => {
        this._versionList.push({result});
        widget.setValue(result.name);
      });
    }
  }

  /**
   * Sets frame range if there are attributes with "start_frame"
   * and "end_frame" associated with it
   *
   * #TODO Should probably refactor finding the widget and setting the value
   */
  setFrameRange(startFrame, endFrame) {
    for (const attr of this._dataType.attribute_types) {
      if (attr.style === "start_frame") {
        for (const widget of this._div.children) {
          const name = widget.getAttribute("name");
          if (name == attr.name) {
            widget.setValue(startFrame);
            break;
          }
        }
      }
      else if (attr.style === "end_frame") {
        for (const widget of this._div.children) {
          const name = widget.getAttribute("name");
          if (name == attr.name) {
            widget.setValue(endFrame);
            break;
          }
        }
      }
    }
  }

  setValues(values, associatedTrack, associatedTrackType) {
    // Set the ID widget
    this._idWidget.setValue(values.id);

    // Set the user widget
    var createdByUsername = null;
    var foundUser = false;
    for (let index = 0; index < this._userList.length; index++) {
      if (this._userList[index].id == values.created_by || this._userList[index].id == values.user) {
        foundUser = true;
        createdByUsername = this._userList[index].result.username;
        break;
      }
    }

    if (!foundUser) {
      if (values.created_by == null || values.created_by == "") {
        this._getUsername(values.user, this._createdByWidget);
      }
      else {
        this._getUsername(values.created_by, this._createdByWidget);
      }
    }
    else {
      this._createdByWidget.setValue(createdByUsername);
    }

    // Check if the slider needs to be updated if there's different track data now.
    // If so, then update it.
    let trackSegmentsUpdated = false;
    if (this._trackSegments && values.segments){
       trackSegmentsUpdated = this._trackSegments != values.segments;
    }

    // Skip resetting slider if we already display this track
    if (this._track && this._track.id == values.id && !trackSegmentsUpdated)
    {
      return;
    }

    this._emitChanges = false;

    // only relevant if we are dealing with objects
    // with ids
    if (this._dataType.isTrack)
    {
      this._track = values;
    }

    let sliderData = {};
    sliderData.segments = values.segments;
    sliderData.currentFrame = this._currentFrame;
    this.setSlider(sliderData);

    // If the provided values contain a track association ID, then display
    // the go to track button. Otherwise, hide it.
    if (associatedTrack != undefined && associatedTrackType != undefined)
    {
      this._goToTrackLabel.textContent = "View Associated " + associatedTrackType.name;
      this._associatedTrack = associatedTrack;
      this.displayGoToTrack(true);
    }
    else
    {
      this.displayGoToTrack(false);
    }

    for (const widget of this._div.children) {
      const name = widget.getAttribute("name");
      const value = values.attributes[name];
      // Only set the name if it is defined
      if (value != undefined) {
        widget.setValue(values.attributes[name]);
      } else if (!["ID", "Created By"].includes(name)) {
        widget.reset();
      }
    }

    this._setBuiltInAttributes(values);
    this._setHiddenAttributes(values);

    this._emitChanges = true;
  }

  reset() {
    // Sets all widgets to default
    for (const widget of this._div.children) {
      widget.reset();
    }
  }
}

customElements.define("attribute-panel", AttributePanel);
