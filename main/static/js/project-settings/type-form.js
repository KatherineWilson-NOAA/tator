class TypeForm extends TatorElement {
  constructor() {
    super();

    // Correct name for the type, ie. "LocalizationType"
    this.typeName = "";
    this.readableTypeName = "";

    // Main Div
    this.typeFormDiv = document.createElement("div");
    this.typeFormDiv.setAttribute("class", "pl-md-6")
    this._shadow.appendChild(this.typeFormDiv);

    // Required helpers.
    this.inputHelper = new SettingsInput("");
    this.attributeFormHelper = new AttributesForm();
    
    // Loading spinner
    this.loading = new LoadingSpinner();
    this._shadow.appendChild( this.loading.getImg());
  }

  _init({ data, modal, sidenav}){
    // Log to verify init
    // console.log(`${this.readableTypeName} init.`);
    // console.log(data);
    
    // Initial values
    this.data = data;
    this.modal = modal;
    this.projectId = this.data.project;
    this.typeId = this.data.id
    this.sideNav = sidenav;

    // Pass modal to helper
    this.boxHelper = new SettingsBox( this.modal );

    // Add form to page
    this.setupFormPage(data)
  }

  async setupFormPage(data = this.data) {
    // Section h1.
    // New heading element.
    this.h1 = document.createElement("h1");
    this.h1.setAttribute("class", "h3 pb-3 edit-project__h1");

    // Create a form with values, or empty editable form
    if (!this.data.form && !this.data.form != "empty") {
      if (this.typeName == "Membership") {
        this.h1_name = document.createTextNode(`${this.data.username} `);
      } else {
        this.h1_name = document.createTextNode(`${this.data.name} `);
      }
      this.h1.appendChild(this.h1_name);

      this.separate_span = document.createElement("span");
      this.separate_span.setAttribute("class", "px-2");
      this.h1.appendChild(this.separate_span);
      const h1_separate_span = document.createTextNode(`|`);
      this.separate_span.appendChild(h1_separate_span);

      this.type_span = document.createElement("span");
      this.type_span.setAttribute("class", "text-gray text-normal");
      this.h1.appendChild(this.type_span);
      const h1_type = document.createTextNode(` ${this.typeName}`);
      this.type_span.appendChild(h1_type);

      this.id_span = document.createElement("span");
      this.id_span.setAttribute("class", "text-gray text-normal");
      this.h1.appendChild(this.id_span);
      const h1_id = document.createTextNode(` (ID ${this.data.id})`);
      this.id_span.appendChild(h1_id);
      
      // Add all elements to page
      this.typeFormDiv.appendChild(this.h1);
      const sectionForm = await this._getSectionForm(this.data);
      this.typeFormDiv.appendChild( sectionForm );
      this.typeFormDiv.appendChild( this._getAttributeSection( ) );
      this.typeFormDiv.appendChild( this._getSubmitDiv( {"id": this.data.id }) );
      this.typeFormDiv.appendChild( this.deleteTypeSection() );
      return this.typeFormDiv;
    } else {
      const t = document.createTextNode(`Add new ${this.readableTypeName}.`); 
      this.h1.appendChild(t);

      this.typeFormDiv.appendChild(this.h1);
      
      const sectionForm = await this._getSectionForm(this._getEmptyData());
      this.typeFormDiv.appendChild(this.h1);
      this.typeFormDiv.appendChild( sectionForm );

      return this.typeFormDiv;
    }
  }

  _getSubmitNewDiv(){
    let text = document.createTextNode("Save");
    this.savePost = document.createElement("Button");
    this.savePost.appendChild(text);
    this.savePost.setAttribute("value", "Save");
    this.savePost.setAttribute("class", `btn btn-clear text-center f1 text-semibold`);
    this.savePost.style.margin = "0 auto";
    this.savePost.addEventListener("click", this._savePost.bind(this));
    
    return this.savePost;
  }

  _savePost(){
    this.loading.showSpinner();
    let addNew = new TypeNew({
      "type" : this.typeName,
      "projectId" : this.projectId
    });

    let formData = this._getFormData("New");

    addNew.saveFetch(formData).then(([data, status]) => {
      this.loading.hideSpinner();

      if(status != 400){
        // Hide the add new form
        this.sideNav.hide(`itemDivId-${this.typeName}-New`);

        // Create and show the container with new type
        this.sideNav.addItemContainer({
          "type" : this.typeName,
          "id" : data.id,
          "hidden" : false
        });

        let form = document.createElement( this._getTypeClass() );

        this.sideNav.fillContainer({
          "type" : this.typeName,
          "id" : data.id,
          "itemContents" : form
        });

        // init form with the data
        formData.id = data.id;
        formData.project = this.projectId;
        if(this.typeName == "LocalizationType" || this.typeName == "StateType") formData.media = formData.media_types;
        form._init({ 
          "data": formData, 
          "modal" : this.modal, 
          "sidenav" : this.sideNav
        });

        // Add the item to navigation
        this._updateNavEvent("new", formData.name, data.id);

              // Let user know everything's all set!
        return this._modalSuccess(data.message);
      } else {
        return this._modalError(data.message);
      } 


    }).catch((err) => {
      console.error(err);
      this.loading.hideSpinner();
      return this._modalError("Error adding new type.");
    });
  }

  // this.settingsViewClasses = [
  //   "project-main-edit",
  //   "media-type-main-edit",
  //   "localization-edit",
  //   "leaf-type-edit",
  //   "state-type-edit"
  // ];

  _getTypeClass(){
    switch (this.typeName) {
      case "MediaType" :
        return "media-type-main-edit";
      case "LocalizationType" :
        return "localization-edit";
      case "LeafType" :
        return  "leaf-type-edit";
      case "StateType" : 
        return "state-type-edit";
      case "Project" : 
        return "project-main-edit";
      case "Membership" :
        return "membership-edit";
      default:
        break;
    }
  }

  //
  _getSubmitDiv({id = -1} = {}){
    const submitDiv = document.createElement("div");
    submitDiv.setAttribute("class", "d-flex flex-items-center flex-justify-center py-3");

    // Save button and reset link
    submitDiv.appendChild( this._saveEntityButton(id) );
    submitDiv.appendChild( this._resetEntityLink(id) );

    return submitDiv;
  }

  _getAttributeSection(){
    this.attributeSection = document.createElement("attributes-main");
    this.attributeSection.setAttribute("data-from-id", `${this.typeId}`)
    this.attributeSection._init(this.typeName, this.typeId, this.data.name, this.projectId, this.data.attribute_types, this.modal);
    
    // Register the update event - If attribute list name changes, or it is to be added/deleted listeners refresh data
    this.attributeSection.addEventListener('settings-refresh', this._attRefreshListener.bind(this) );

    return this.attributeSection;
  }

  _attRefreshListener(e){
    return this.resetHard();
  }

  _saveEntityButton(id){
    this.saveButton = this.inputHelper.saveButton();
    this.saveButton.addEventListener("click", (event) => {
      event.preventDefault();
      if( this.changed || (this.attributeSection && this.attributeSection.hasChanges) ){
        console.log("Save for id: "+id);
        this._save( {"id":id} )
      } else {
        // @TODO- UX Save button disabled until form change
        let happyMsg = "Nothing new to save!";
        this._modalSuccess( happyMsg );
      }
    });
    return this.saveButton;
  }

  _resetEntityLink(id){
    this.resetLink = this.inputHelper.resetLink();

    // Form reset event
    this.resetLink.addEventListener("click", (event) => {
      event.preventDefault();
      this.reset(id)
      console.log("Reset complete.");
    });
    return this.resetLink;
  }

  // form with parts put together
  _setForm(){
    this._form = document.createElement("form");
    this._form.id = this.typeId;

    //this._form.addEventListener("change", this._formChanged.bind(this));

    return this._form;
  }

  _getHeading(){
    let headingSpan = document.createElement("span");
    let labelSpan = document.createElement("span");
    labelSpan.setAttribute("class", "item-label");
    let t = document.createTextNode(`${this.readableTypeName}s`); 
    labelSpan.appendChild(t);
    headingSpan.innerHTML = this.icon;
    headingSpan.appendChild(labelSpan);

    return headingSpan;
  }

  deleteTypeSection(){
    let button = document.createElement("button");
    button.setAttribute("class", "btn btn-small btn-charcoal float-right btn-outline text-gray");
    button.style.marginRight = "10px";

    let deleteText = document.createTextNode(`Delete`);
    button.appendChild( deleteText );

    let descriptionText = `Delete this ${this.readableTypeName} and all its data?`;
    let headingDiv = document.createElement("div");
    headingDiv.setAttribute("class", "clearfix py-6");

    let heading = document.createElement("div");
    heading.setAttribute("class", "py-md-5 float-left col-md-5 col-sm-5 text-right");
    
    heading.appendChild( button );
        
    let description = document.createElement("div");
    let _descriptionText = document.createTextNode("");
    _descriptionText.nodeValue = descriptionText;
    description.setAttribute("class", "py-md-6 f1 text-gray float-left col-md-7 col-sm-7");
    description.appendChild( _descriptionText );
    
    headingDiv.appendChild(heading);
    headingDiv.appendChild(description);

    this.deleteBox = this.boxHelper.boxWrapDelete( {
      "children" : headingDiv
    } );

    this.deleteBox.style.backgroundColor = "transparent";

    button.addEventListener("click", this._deleteTypeConfirm.bind(this))

    return this.deleteBox;
  }

  _deleteTypeConfirm(){
    let button = document.createElement("button");
    let confirmText = document.createTextNode("Confirm")
    button.appendChild(confirmText);
    button.setAttribute("class", "btn btn-clear f1 text-semibold")

    button.addEventListener("click", this._deleteType.bind(this));

    this._modalConfirm({
      "titleText" : `Delete Confirmation`,
      "mainText" : `Pressing confirm will delete this ${this.typeName} and all its data from your account. Do you want to continue?`,
      "buttonSave" : button,
      "scroll" : false    
    });
  }

  _deleteType(){
    this._modalCloseCallback();
    this.loading.showSpinner();
    let deleteType = new TypeDelete({
      "type" : this.typeName,
      "typeId" : this.typeId
    });
  
    if(this.typeId != "undefined"){
      deleteType.deleteFetch().then((data) => {
        this._updateNavEvent("remove");
        this.loading.hideSpinner();
        return this._modalComplete(data.message);
      }).catch((err) => {
        console.error(err);
        this.loading.hideSpinner();
        return this._modalError("Error with delete.");
      });
    } else {
      console.error("Type Id is not defined.");
      this.loading.hideSpinner();
      return this._modalError("Error with delete.");
    }

  }

  _getEmptyData() {
    return {
      "id" : `New`,
      "name" : "",
      "project" : this.projectId,
      "description" : "",
      "visible" : false,
      "grouping_default" : false,
      "media" : [],
      "dtype" : "",
      "colorMap" : null,
      "interpolation" : "none",
      "association" : "Media",
      "line_width" : 2,
      "delete_child_localizations" : false,
      "form" : "empty"
    };
  }


  // FETCH FROM MODEL PROMISE STRUCTURE
  // GET ALL {typeName}
  _fetchGetPromise({id = this.projectId} = {}){
    return fetch(`/rest/${this.typeName}s/${id}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
  }

  // GET {typeName} {ID}
  _fetchByIdPromise({id = this.typeId} = {}){
    return fetch(`/rest/${this.typeName}/${id}`, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
  }

  // PATCH
  _fetchPatchPromise({id = -1 } = {}){
    console.log("Form data for patch id: "+id);
    let formData = this._getFormData(id);

    if(this._shadow.querySelectorAll(".errored").length > 0 || this._shadow.querySelectorAll(".invalid").length > 0){
      return this._modalError("Please fix form errors first.");
    } else if (Object.entries(formData).length === 0) {
      console.log("No formData")
      return this._modalSuccess("Nothing new to save!");
    } else {
      return fetch(`/rest/${this.typeName}/${id}`, {
        method: "PATCH",
        mode: "cors",
        credentials: "include",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
    }
  }



  _save({id = -1, globalAttribute = false} = {}){
    // If any fields still have errors don't submit the form.
    const errorList = this._shadow.querySelectorAll(`.errored`);
    if(errorList && errorList.length > 0) return this._modalError("Please fix form errors.");;
    
    // Start spinner & Get promises list
    console.log("Settings _save method for id: "+id);
    this.loading.showSpinner();
    
    let promises = []
    let errors = 0;

    // Main type form
    if( this.changed ) {
      let mainPromise = this._fetchPatchPromise({id});
      
      // Promise will return false if there are errors.
      if(mainPromise){
        promises.push( this._fetchPatchPromise({id}) );
      } else {
        errors += 1;
      }
    }

    let hasAttributeChanges = false;
    const attrPromises = {};
    if(this.attributeSection && this.attributeSection.hasChanges){
      hasAttributeChanges = true;
      const attrFormsChanged = this.attributeSection.attrForms.filter( form => form._changed );

      if(attrFormsChanged && attrFormsChanged.length > 0){
        // Check Attr forms first for errors if there are changes.
        errors += 1;
      } else if (attrFormsChanged && attrFormsChanged.length > 0){
        // If any of the changed but no errors, proceed.
        attrPromises.promises = [];
        attrPromises.attrNamesNew = [];
        attrPromises.attrNames = [];

        if(attrFormsChanged && attrFormsChanged.length > 0){
          for(let form of attrFormsChanged){
            let promiseInfo = form._getPromise({ id, entityType : this.typeName });
            attrPromises.promises.push(promiseInfo.promise);
            attrPromises.attrNamesNew.push(promiseInfo.newName);
            attrPromises.attrNames.push(promiseInfo.oldName);
          }

          if(attrPromises){
            promises = [...promises, ...attrPromises.promises];
          } 
        }     
      }
    }

    let messageObj = {};
    if(promises.length > 0 && errors === 0){
      // Check if anything changed
      Promise.all(promises).then( async( respArray ) => {
        let responses = [];
        respArray.forEach((item, i) => {
          responses.push( item.json() )
        });

          Promise.all( responses )
            .then ( dataArray => {
              messageObj = this._handleResponseWithAttributes({
                id,
                dataArray,
                hasAttributeChanges,
                attrPromises,
                respArray
              });

              let message = "";
              let success = false;
              let error = false;
              if(messageObj.messageSuccess) {
                let heading = `<div class=" pt-4 h3 pt-4">Success</div>`;
                message += heading+messageObj.messageSuccess;
                success = true;
              }
              if(messageObj.messageError) {
                let heading = `<div class=" pt-4 h3 pt-4">Error</div>`;
                message += heading+messageObj.messageError;
                error = true;
              }

              if(messageObj.requiresConfirmation) {
                let buttonSave = this._getAttrGlobalTrigger(id);
                let confirmHeading = `<div class=" pt-4 h3 pt-4">Global Change(s) Found</div>`
                let subText = `<div class="f1 py-2">Confirm to update across all types. Uncheck and confirm, or cancel to discard.</div>`
                
                let mainText = `${message}${confirmHeading}${subText}${messageObj.messageConfirm}`;
                this.loading.hideSpinner();
                this._modalConfirm({
                  "titleText" : "Complete",
                  mainText,
                  buttonSave
                });
              } else {
                let mainText = `${message}`;
                this.loading.hideSpinner();
                this._modalComplete(
                  mainText
                );
                // Reset forms to the saved data from model
                this.resetHard();
              }
          }).then( () => {
            // Reset changed flag
            this.changed = false;

            if(hasAttributeChanges){            
              const attrFormsChanged = this.attributeSection.attrForms.filter( form => form._changed );
              if(attrFormsChanged.length > 0 ) {
                for(let f of attrFormsChanged) {
                  f.classList.remove("changed");
                  f.changeReset();
                }
              }
            }
         
          });

        }).catch(err => {
          console.error("File "+ err.fileName + " Line "+ err.lineNumber +"\n" + err);
          this.loading.hideSpinner();
        });
    } else if (!promises.length > 0 ) {

      this.loading.hideSpinner();
      return this._modalSuccess("Nothing new to save!");
    } else if (!errors === 0) {
      this.loading.hideSpinner();
      return this._modalError("Please fix form errors.");
    } else {
      this.loading.hideSpinner();
      return this._modalError("Problem getting saving form data.");
    }
  }

  set changed(val) {
    return this.changed = val;
  }

  changed(){
    return this.changed;
  }

  _formChanged(event) {
    console.log(`Changed: ${event.target.tagName}`);
    return this.changed = true;
  }

  _handleResponseWithAttributes({
    id = -1,
    dataArray = [],
    hasAttributeChanges = false,
    attrPromises = [],
    respArray = []}
    = {}){

    let messageSuccess = "";
    let messageError = "";
    let messageConfirm = "";
    let requiresConfirmation = false;

    respArray.forEach((item, i) => {
      let currentMessage = dataArray[i].message;
      let succussIcon = document.createElement("modal-success");
      let iconWrap = document.createElement("span");
      let warningIcon = document.createElement("modal-warning");
      let index = (hasAttributeChanges && respArray[0].url.indexOf("Attribute") > 0) ? i : i-1;
      let formReadable = hasAttributeChanges ? attrPromises.attrNames[index] : "";
      let formReadable2 = hasAttributeChanges ? attrPromises.attrNamesNew[index] : "";

      if( item.status == 200){
        //console.log("Return Message - It's a 200 response.");
        iconWrap.appendChild(succussIcon);
        messageSuccess += `<div class="py-2">${iconWrap.innerHTML} <span class="v-align-top">${currentMessage}</span></div>`;
      } else if(item.status != 200){
        if (!hasAttributeChanges ){
          iconWrap.appendChild(warningIcon);
          //console.log("Return Message - It's a 400 response for main form.");
          messageError += `<div class="py-2">${iconWrap.innerHTML} <span class="v-align-top">${currentMessage}</span></div>`;
        } else if(hasAttributeChanges && currentMessage.indexOf("without the global flag set") > 0 && currentMessage.indexOf("ValidationError") < 0) {
          //console.log("Return Message - It's a 400 response for attr form.");
          let input = `<input type="checkbox" checked name="global" data-old-name="${formReadable}" class="checkbox"/>`;
          let newName = formReadable == formReadable2 ? "" : ` new name "${formReadable2}"`
          messageConfirm += `<div class="py-2">${input} Attribute "${formReadable}" ${newName}</div>`
          requiresConfirmation = true;            
        } else {
          iconWrap.appendChild(warningIcon);
          messageError += `<div class="py-4">${iconWrap.innerHTML} <span class="v-align-top">Changes editing ${formReadable} not saved.</span></div>`
          messageError += `<div class="f1">Error: ${currentMessage}</div>`
        }
      }
    });

    return {requiresConfirmation, messageSuccess, messageConfirm, messageError};
  }

  _getAttrGlobalTrigger(id){
    let buttonSave = document.createElement("button")
    buttonSave.setAttribute("class", "btn btn-clear f1 text-semibold");
    buttonSave.innerHTML = "Confirm";

    buttonSave.addEventListener("click", (e) => {
      e.preventDefault();
      let confirmCheckboxes = this.modal._shadow.querySelectorAll('[name="global"]');
      this._modalCloseCallback();
         
      for(let check of confirmCheckboxes){
        //add and changed flag back to this one
        let name = check.dataset.oldName;
        let formId = `${name.replace(/[^\w]|_/g, "").toLowerCase()}_${id}`;

        //add back changed flag
        for(let form of this.attributeSection.attrForms){
          // this._shadow.querySelector(`#${formId}`).classList.add("changed");
          if(form.id == formId){
            form.classList.add("changed");
            form.changed = true;
          }
        }

        if(check.checked == true){
          console.log("User marked as global: "+name);
          //this._shadow.querySelector(`#${formId}`).dataset.isGlobal = "true";
          for(let form of this.attributeSection.attrForms){
            // this._shadow.querySelector(`#${formId}`).classList.add("changed");
            if(form.id == formId){
              form.dataset.isGlobal = "true";
            }
          }
        } else {
          console.log("User marked NOT global, do not resend: "+name);

          //this._shadow.querySelector(`#${formId}`).dataset.isGlobal = "false";
        }
      }

      //run the _save method again with global true
      this._save({"id" : id, "globalAttribute" : true})
    });

    return buttonSave;
  }

  _toggleChevron(e){
    var el = e.target;
    return el.classList.toggle('chevron-trigger-90');
  }

  _toggleAttributes(e){
    let el = e.target.parentNode.nextSibling;
    let hidden = el.hidden

    return el.hidden = !hidden;
  };

  // RESET FUNCTIONS
  reset(data = this.data){
    this.typeFormDiv.innerHTML = "";
    return this.setupFormPage(data);
  }

  async resetHard(){
    console.log("Hard reset...");
    this.loading.showSpinner();
    //Utilities.warningAlert("Refreshing data", "#fff", false);
    //const response = await this._fetchGetPromise();
    const response = await this._fetchByIdPromise();
    // const data = await response.json();
    // this.data = this._findDataById(data);
    //Utilities.hideAlert();
    this.data = await response.json();
    this.loading.hideSpinner();

    this.reset(this.data);

    // Update media list in the background
    // In future could send individual media update if fn there to receive it
    if(this.typeName == "MediaType"){
      const mediaList = new DataMediaList(this.projectId);
      mediaList._setProjectMediaList( "", true ); 
    }
  }

  _findDataById(allData){
    for(let x of allData){
      if (x.id == this.typeId) return x;
    }
    return false;
  }

  // MODAL
  _modalSuccess(message){
    this._modalClear();
    let text = document.createTextNode(" Success");
    this.modal._titleDiv.innerHTML = "";
    this.modal._titleDiv.append( document.createElement("modal-success") );
    this.modal._titleDiv.append(text);
    this.modal._main.innerHTML = message;
    //this.modal._main.classList.add("fixed-height-scroll");

    return this.modal.setAttribute("is-open", "true")
  }

  _modalError(message){
    this._modalClear();
    let text = document.createTextNode(" Error");
    this.modal._titleDiv.innerHTML = "";
    this.modal._titleDiv.append( document.createElement("modal-warning") );
    this.modal._titleDiv.append(text);
    this.modal._main.innerHTML = message;
    return this.modal.setAttribute("is-open", "true")
  }

  _modalConfirm({
    titleText = "",
    mainText = "",
    buttonSave = document.createElement("button"),
    scroll = true
  } = {}){
    this._modalClear();
    this.modal._titleDiv.innerHTML = titleText;

    if(mainText.nodeType == Node.ELEMENT_NODE){
      this.modal._main.appendChild(mainText);
    } else {
      this.modal._main.innerHTML = mainText;
    }
    
    if(scroll) this.modal._main.classList.add("fixed-height-scroll");

    let buttonClose = document.createElement("button")
    buttonClose.setAttribute("class", "btn btn-clear f1 text-semibold btn-charcoal");
    buttonClose.innerHTML = "Cancel";

    buttonClose.addEventListener("click", this.modal._closeCallback);

    this.modal._footer.appendChild(buttonSave);
    this.modal._footer.appendChild(buttonClose);
    return this.modal.setAttribute("is-open", "true");
  }

  _modalComplete(message){
    this._modalClear();
    let text = document.createTextNode("Complete");
    this.modal._titleDiv.innerHTML = "";
    this.modal._titleDiv.append(text);
    this.modal._main.innerHTML = message;
    this.modal._footer.innerHTML = "";
    this.modal._main.classList.remove("fixed-height-scroll");

    return this.modal.setAttribute("is-open", "true");
  }

  _modalClear(){
    this.modal._titleDiv.innerHTML = "";
    this.modal._main.innerHTML = "";
    this.modal._footer.innerHTML = "";
    
    return this.modal;
  }

  _modalCloseCallback(){
    return this.modal._closeCallback();
  }

  // Update the navigation
  _updateNavEvent(whatChanged, newName = "", newId = -1){
    if(whatChanged == "remove"){
      let event = this.sideNav.removeItemEvent(this.typeId, this.typeName);
      this.sideNav.dispatchEvent(event);
    } else if(whatChanged == "rename") {
      let event = this.sideNav.renameItemEvent(this.typeId, this.typeName, newName);
      this.sideNav.dispatchEvent(event);
    } else if(whatChanged == "new") {
      let event = this.sideNav.newItemEvent(newId, this.typeName, newName);
      this.sideNav.dispatchEvent(event);
    } else {
      console.log("Need more information to update the sidenav.");
    }
  }

}

customElements.define("type-form", TypeForm);
