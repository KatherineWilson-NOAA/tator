class ProjectSettings extends TatorPage {
  constructor() {
    super();

    this.loading = new LoadingSpinner();
    this._shadow.appendChild( this.loading.getImg());
    this.loading.showSpinner();

    this.main = document.createElement("main");
    this.main.setAttribute("class", "position-relative");
    this._shadow.appendChild(this.main);

    // Navigation panels main for item settings.
    this.settingsNav =  document.createElement("settings-nav");
    this.main.appendChild( this.settingsNav );

    this.settingsViewClasses = [
      "project-main-edit",
      "media-type-main-edit",
      "localization-edit",
      "leaf-type-edit",
      "state-type-edit"
    ];

    // Error catch all
    window.addEventListener("error", (evt) => {
      //
    });

  }

  /* Get personlized information when we have project-id, and fill page. */
  static get observedAttributes() {
    return ["project-id"].concat(TatorPage.observedAttributes);
  }
  attributeChangedCallback(name, oldValue, newValue) {
    TatorPage.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
    switch (name) {
      case "project-id":
        this._init();
        break;
    }
  }

  /* Run when project-id is set to run fetch the page content. */
  _init() {
    this.projectId = this.getAttribute("project-id");
    this.projectView = new ProjectMainEdit();
    this.typesData = new ProjectTypesData(this.projectId);
    let typePromises = this.typesData._getAllTypePromises();

    const promiseList = [
      this.projectView._fetchGetPromise({"id": this.projectId} ),
      ...typePromises
    ];

    Promise.all(promiseList)
    .then( async([pa, mta, lo, le, st]) => {
      const projectData = pa.json();
      const mediaTypesData = mta.json();
      const localizationData = lo.json();
      const leafTypeData = le.json();
      const stateTypeData = st.json();
      Promise.all( [projectData, mediaTypesData, localizationData, leafTypeData, stateTypeData] )
        .then( (dataArray) => {
          this.loading.hideSpinner();
          
          for(let i in dataArray){
            // Add a navigation section
            let objData =  dataArray[i] ;
            let tc = this.settingsViewClasses[i];
            let formView = document.createElement(tc);

            console.log(`Starting navigation panels for ${formView.typeName}`);
            console.log(objData);

            if(formView.typeName == "Project"){
              // Add project container and nav (set to selected)
              this.makeContainer({
                objData, 
                "classBase": formView,
                "hidden" : false
              });


              // Fill it with contents
              this.settingsNav.fillContainer({
                "type" : formView.typeName,
                "id" : objData.id,
                "itemContents" : formView
              });

              // init form with the data
              formView._init(objData)

              // Add nav to that container
              this.settingsNav._addSimpleNav({
                "name" : formView._getHeading(),
                "type" : formView.typeName ,
                "id" : objData.id,
                "selected" : true
              });

            } else {
              // Add item containers for Types
              this.makeContainers({
                objData, 
                "classBase": formView
              });

              // Add navs
              this.settingsNav._addNav({
                "name" : formView._getHeading(),
                "action" : formView._getAddTypeTrigger(), 
                "type" : formView.typeName, 
                "subItems" : objData 
              });

              // Add contents for each Entity
              for(let g of objData){
                let form = document.createElement(tc);
                
                  this.settingsNav.fillContainer({
                    "type" : form.typeName,
                    "id" : g.id,
                    "itemContents" : form
                  });

                  // init form with the data
                  form._init(g)
              }
            }
          }    

        })
        //.catch(err => {
        //  console.error("Error: "+ err);
        //  this.loading.hideSpinner();
        //});
      });
  }

  makeContainer({objData = {}, classBase, hidden = true}){
    // Adds item panels for each view
    this.settingsNav.addItemContainer({
      "type" : classBase.typeName,
      "id" : objData.id,
      //"itemContents" : classBase,
      hidden
    });
  }
  
  makeContainers({objData = {}, classBase, hidden = true}){
     for(let data of objData){
       console.log("Data ID: "+data.id);
      this.makeContainer({"objData" : data, classBase, hidden});
    }
  }

}

customElements.define("project-settings", ProjectSettings);
