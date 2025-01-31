import { TatorElement } from "../tator-element.js";
import { getCookie } from "../../util/get-cookie.js";
import { FilterConditionData } from "../../util/filter-utilities.js";

import { SettingsBox } from "../../project-settings/settings-box-helpers.js";



export class GalleryBulkEdit extends TatorElement {
   constructor() {
      super();
      /**
       * Bulk edit is added to a gallery
       * When multiselect cues are heard, it changes the view
       * 1. Bar slides up - easily dismissable, clear selection cues for already selected and selectable
       * 2. Stay on the same URL but need to be abel to hide: header
       * 3. Save data as essentially a new card list? Xing out returns full list.
       * 
       * Questions: Do I use a gallery copy or it directly?
       * What is max that can be selected?
       * 
       */
      // // // Mesage bar top
      // this._messageBar_top = document.createElement("div");
      // this._messageBar_top.setAttribute("class", "px-6 py-2 "); //bulk-edit-bar_top text-center hidden
      // this._messageBar_top.hidden = true;
      // this._shadow.appendChild(this._messageBar_top);

      // this._h2 = document.createElement("h2");
      // this._h2.setAttribute("class", "py-2 px-2 f1 semi-bold");
      // this._h2.innerHTML = `<span class="text-bold">Selection Mode:</span> <kbd>Ctrl</kbd> + <kbd>A</kbd> to select all. <kbd>Esc</kbd> to exit.`;
      // this._messageBar_top.appendChild(this._h2);




      // Message Panel
      this._bulkEditBar = document.createElement("div");
      this._bulkEditBar.setAttribute("class", "bulk-edit-bar px-3 hidden py-4")
      this._shadow.appendChild(this._bulkEditBar);



      /**
       * Listen for actions: edit and compare to change panel
       */
      this._selectionPanel = document.createElement("entity-gallery-multi-selection-panel");
      // this._selectionPanel.addEventListener("bulk-edit-click", this._showEditPanel.bind(this));
      this._selectionPanel.addEventListener("bulk-edit-click", this._saveBulkEdit.bind(this));
      this._selectionPanel.addEventListener("comparison-click", this._showComparisonPanel.bind(this));
      this._selectionPanel.addEventListener("clear-selection", this._clearSelection.bind(this));
      this._selectionPanel.addEventListener("select-all", this.selectAllOnPage.bind(this));
      // this._bulkEditBar.appendChild(this._selectionPanel);

      // Edit panel
      this._editPanel = document.createElement("entity-gallery-multi-attribute-edit-panel");
      this._editPanel.addEventListener("select-click", this._showSelectionPanel.bind(this)); // Back
      this._editPanel.addEventListener("save-edit-click", this._saveBulkEdit.bind(this));
      this._editPanel.addEventListener("comparison-click", this._showComparisonPanel.bind(this));
      this._selectionPanel.addEventListener("clear-selection", this._clearSelection.bind(this));
      this._editPanel.hidden = true;
      this._bulkEditBar.appendChild(this._editPanel);



      // Comparison panel
      this._comparisonPanel = document.createElement("entity-gallery-attribute-comparison-panel");
      this._comparisonPanel.addEventListener("select-click", this._showSelectionPanel.bind(this)); // Back
      this._comparisonPanel.addEventListener("save-edit-click", this._showEditPanel.bind(this));
      this._comparisonPanel.addEventListener("comparison-click", this._showComparisonPanel.bind(this));
      this._comparisonPanel.hidden = true;
      this._bulkEditBar.appendChild(this._comparisonPanel);

      // this._bulkCorrect = document.createElement("bulk-correct-button");
      // this._bulkCorrect.style.position = "absolute";
      // this._bulkCorrect.style.top = "0";
      // this._bulkCorrect.style.right = "0";
      // this._selectionPanel._bulkEditMiddle.appendChild(this._bulkCorrect);

      // this._bulkCorrect.addEventListener("click", () => {
      //    return this._showEditPanel();
      // });

      // this._selectionPanel._editButton.before(this._editPanel._bulkEditForm);

      // this._selectionPanel._minimize.addEventListener("click", () => {
      //    this._selectionPanel._minimize.classList.toggle("arr-up");
      //    // this._selectionPanel._minimize.classList.toggle("arr-down");
      //    return this._bulkEditBar.classList.toggle("minimized");
      // });

      /**
       * Initially selection panel is shown
       */
      // this._selectionPanel.show(true);

      // When someone starts shift select, then we connect between the two
      // If they haven't shift + selected, just single select
      this._editMode = false;
      this._shiftSelect = false;
      this._ctrlSelect = false;

      this._shiftSelectedFirst = null;
      this._shiftSelectedNext = null;

      // Listen when shift stops
      var userAgent = navigator.userAgent;
      var mobileFirefox = userAgent.indexOf("Firefox") !== -1 && userAgent.indexOf("Mobile") !== -1;
      // 'keyup' event will not be fired on Mobile Firefox, so we have to use 'input' event instead
      var keyUpEventName = mobileFirefox ? "input" : "keyup";
      document.addEventListener(keyUpEventName, this._keyUpHandler.bind(this));

      // Listen to escape or Close
      document.addEventListener("keydown", this._keyDownHandler.bind(this));
      this._selectionPanel.xClose.addEventListener("click", this._escapeEditMode.bind(this));
      this._editPanel.xClose.addEventListener("click", this._escapeEditMode.bind(this));

      this._editPanel._bulkEditModal.addEventListener("close", () => {
         if (this._page) {
            this._page.hideDimmer();
         }
      });

      // Data holders for maintaining panels
      this._currentMultiSelection = new Set();
      this._currentMultiSelectionToId = new Map();
      this._currentSelectionObjects = new Map();
      this._localizationTypes = new Set();
      this.setOfSelectedMetaIds = new Set();

      // Flags for the UI
      this._editPanelWasOpen = false;
      this.resultsFilter = {
         containsAttributes: false,
         attributes: [],
         filterObj: {}
      };

      this._requiresPrefetch = false;
   }

   set elementList(val) {
      // console.log("this._elements  updated");
      // console.log(this._elements);
      this._elements = val;
   }

   set elementIndexes(val) {
      this._elementIndexes = val;
   }



   init(page, gallery, type = "localization", projectId = null, additionalTools = false) {
      // console.log("BULK EDIT INITIALIZED!");
      this._page = page;
      this._projectId = this._page.getAttribute("project-id");
      this._editType = type;

      if (type == "media") {
         this._editPanel.xClose.classList.remove("hidden");
         this._selectionPanel.xClose.classList.remove("hidden");
         this._editPanel._selectionCountText.textContent = "Media(s)";
      } else {
         this._selectionPanel._galleryLink.hidden = false;
      }

      if (additionalTools) {
         this._editPanel.tools = additionalTools;
      }

      this.boxHelper = new SettingsBox(this._page.modal);

      if (gallery == null) {
         this._gallery = this._page._filterResults
      } else {
         this._gallery = gallery;
      }
   }

   _keyUpHandler(e) {
      // if (e.key == "Control") {
      //    this._ctrlSelect = false;
      // }
      // if (e.key == "Shift") {
      //    this._shiftSelect = false;
      // }
   }

   _keyDownHandler(e) {
      // console.log(`Key: ${e.key}`);
      // console.log(`Code: ${e.key}`);

      if (e.key == "Escape") {
         // console.log(`Escape!`)
         // this._escapeEditMode();
         this._clearSelection();
      }

      if (e.code == "Control") {
         if (e.code == "a" || e.code == "A") {
            this.selectAllOnPage();
         }
      }

      if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
         e.preventDefault();
         // console.log("Control+A");
         this.selectAllOnPage();
      }

      // if (e.code == "Enter") {
      //    console.log("KeyDown Enter!")
      //    console.log(this._editPanel._bulkEditModal.hasAttribute("is-open"));
      //    if (this._editPanel._bulkEditModal.hasAttribute("is-open")) {
      //       console.log("Show selection panel!");
      //       this._showSelectionPanel();
      //    } else {
      //       console.log(this._selectionPanel.hidden == false);
      //       console.log(this._count);
      //       if (this._selectionPanel.hidden == false && this._count != 0) {
      //          console.log("Save with enter!");
      //          this._saveBulkEdit();
      //       }
      //    }
      // }

   }

   shiftSelect({ element, id, isSelected }) {
      // console.log("Shift select");
      // if (!this._editMode) this.startEditMode();

      // // clicked element
      // // first shift click is start, and if click isn't broken
      // if (this._shiftSelectedFirst == null) {
      //    console.log('Saving shift click first el')
      //    this._shiftSelectedFirst = element;
      // } else {
      //    console.log('Saving shift click secon el')
      //    this._shiftSelectedSecond = element;

      //    // firstIndex - secondIndex
      //    let firstIndex = this._elementIndexes[this._shiftSelectedFirst.cardObj.id];
      //    let secondIndex = this._elementIndexes[id];
      //    let inBetween = secondIndex - firstIndex;
      //    console.log(`inBetween secondIndex ${secondIndex} - firstIndex ${firstIndex} = ${inBetween} .... Math.sign(inBetween) = ${Math.sign(inBetween)}`);

      //    if (Math.sign(inBetween) == -1) {
      //       let startIndex = secondIndex  - 1;
      //       for (let i = startIndex; startIndex < firstIndex; i--){
      //          if (!element._li.classList.contains("is-selected")) {
      //             this._addSelected({ element:element.card, id: element.card.cardObj.id, isSelected: element.card._li.classList.contains("is-selected") });
      //          }
      //       }
      //    } else if (Math.sign(inBetween) == 1) {
      //       let startIndex = firstIndex + 1;
      //       for (let i = startIndex; startIndex < secondIndex; i++){
      //          if (!element._li.classList.contains("is-selected")) {
      //             this._addSelected({ element:element.card, id: element.card.cardObj.id, isSelected: element.card._li.classList.contains("is-selected") });
      //          }
      //       }
      //    }
      // }
   }

   selectAllOnPage() {
      if (!this._editMode) this.startEditMode();
      for (let el of this._elements) {
         let id = el.card.cardObj.id;
         if (!this._currentMultiSelection.has(id)) {
            if (el.card._li.classList.contains("is-selected")) {
               //this._removeSelected({ element:el.card, id, isSelected: el.card._li.classList.contains("is-selected") });
            } else {
               this._addSelected({ element: el.card, id, isSelected: el.card._li.classList.contains("is-selected") });
            }
         }
      }
   }

   _addSelected({ element, id, isSelected }) {
      // console.log("Add selected");
      if (!this._editMode) this.startEditMode();

      element._li.classList.add("is-selected");
      element._multiSelectionToggle = true

      this._currentMultiSelection.add(id);
      this._currentSelectionObjects.set(id, element.cardObj);
      this.setOfSelectedMetaIds.add(element.cardObj.entityType.id);
      this._updatePanelCount(this._currentMultiSelection.size);
      this._editPanel.hideShowTypes(this.setOfSelectedMetaIds);
      let entityId = element.cardObj.entityType.id;

      // list is a set to ensure uniqueness of additions in list
      let list = typeof this._currentMultiSelectionToId.get(entityId) !== "undefined" ? this._currentMultiSelectionToId.get(entityId) : new Set();
      list.add(id);

      this._currentMultiSelectionToId.set(entityId, list);
   }

   _removeSelected({ element, id, isSelected }) {
      // console.log("remove selected");
      if (isSelected) {
         element._li.classList.remove("is-selected");
      }
      // if (element._multiSelectionToggle) {
      //    element._multiSelectionToggle = false;
      // }
      this._currentMultiSelection.delete(id);
      this._currentSelectionObjects.delete(id);

      let entityId = element.cardObj.entityType.id;
      let idsInType = this._currentMultiSelectionToId.get(entityId);


      if (idsInType.length == 1) {
         // if the only id selected for this type is this one, then clean it out and update view
         this._currentMultiSelectionToId.delete(entityId);
         this.setOfSelectedMetaIds.delete(entityId);
         this._editPanel.hideShowTypes(this.setOfSelectedMetaIds);
      } else {
         // just remove it from the selection list
         idsInType.delete(id);
         this._currentMultiSelectionToId.set(entityId, idsInType);
      }

      this._updatePanelCount(this._currentMultiSelection.size);
   }

   _updatePanelCount(count) {
      this._count = count;
      // this._comparisonPanel._selectionCount.textContent = count;
      this._editPanel.setCount(count);
      // this._selectionPanel.setCount(count);

      // check on the table data too....
      // this._comparisonPanel._refreshTable(this._currentSelectionObjects);
   }



   _openEditMode(e) {
      // console.log("Bulk edit is running open edit mode with this event....... detail");
      // console.log(e.detail);
      // let clickType = typeof e.detail.clickDetail == "undefined" ? e.type : e.detail.clickDetail.type;

      // if (clickType == "shift-select") {
      //    this.shiftSelect(e.detail);
      // } else {
      if (e.detail.isSelected) {
         this._removeSelected(e.detail);
      } else {
         this._addSelected(e.detail);
      }
      // }

      this._updatePanelCount(this._currentMultiSelection.size);
   }

   // Used on pagination, and in clear selection 
   clearAllCheckboxes() {
      if (this._elements && this._elements.length > 0) {
         for (let el of this._elements) {
            el.card._li.classList.remove("is-selected");
            el.card._multiSelectionToggle = false;
         }        
      }

   }

   _clearSelection() {
      // console.log("CLEARING SELECTION! (in _clearSelection) ");
      this._currentMultiSelection.clear();
      this._currentSelectionObjects.clear();
      this._currentMultiSelectionToId.clear();
      // this._currentSelectionObjects.clear();
      this.setOfSelectedMetaIds.clear();
      this._editPanel.hideShowTypes(this.setOfSelectedMetaIds);

      this.clearAllCheckboxes();
      this._updatePanelCount(0);
   }

   resetElements() {
      this.elementList = [];
      this.elementIndexes = [];
   }

   startEditMode() {
      // console.log("startEditMode");
      this._editMode = true;

      for (let el of this._elements) {
         const cardFromEl = typeof el.cardInfo != "undefined" ? el.cardInfo.card : el.card;
         cardFromEl.multiEnabled = true;
         if (cardFromEl._li.classList.contains("is-selected") && !this._currentMultiSelection.has(cardFromEl.cardObj.id)) {
            this._addSelected({ element: cardFromEl, id: cardFromEl.cardObj.id, isSelected: cardFromEl._li.classList.contains("is-selected") })
         }
      }

      // show edit drawer and tools
      // this._messageBar_top.classList.remove("hidden");
      this._bulkEditBar.classList.remove("hidden");

      if (this._editType != "media") {
         if (this._page.main.classList.contains("col-9")) {
            // console.log("_editPanelWasOpen is being set to true");
            this._editPanelWasOpen = true;
            this._page.main.classList.remove("col-9");
            this._page.main.classList.add("col-12");
         } else {
            this._editPanelWasOpen = false;
         }
      }


      // // hide page elements
      // this._page._header.classList.add("hidden");
      // this._page.aside.classList.add("hidden");

      // // this._page.main.style.marginTop = "-100px";
      // this._page.main.style.paddingBottom = "300px";
      // this._page._filterView.classList.add("hidden");
      // this._page._filterResults._ul.classList.add("multi-select-mode");
      this._gallery._ul.classList.add("multi-select-mode");

      this.dispatchEvent(new Event("multi-enabled"));

      if (this.resultsFilter.containsAttributes == true) {
         this._editPanel.addEventListener("attribute-is-filtered-on", (e) => {
            if (e.detail.names.length > 0) {
               // console.log("Setting this._requiresPrefetch = true");
               this._requiresPrefetch = true;
            } else {
               // console.log("Setting this._requiresPrefetch = false");
               this._requiresPrefetch = false;
            }
         });
      }

      this._showEditPanel(true);
   }

   _escapeEditMode(e) {
      e.preventDefault();
      this._editMode = false;

      // hide edit drawer and tools
      // this._messageBar_top.classList.add("hidden");
      this._bulkEditBar.classList.add("hidden");

      // In correction page this panel stays open, in media is it open / shut
      if (this._editType == "media" && !this._selectionPanel.isHidden()) {
         this._selectionPanel.show(false);
      }

      if (this._editPanelWasOpen && this._editType != "media") {
         this._page.main.classList.add("col-9");
         this._page.main.classList.remove("col-12");
         // reset this 
         this._editPanelWasOpen = false;
      }

      // revert page elements
      this._page._header.classList.remove("hidden");
      this._page.aside.classList.remove("hidden");
      this._page.main.style.marginTop = "0";
      // this._page._filterView.classList.remove("hidden");
      // this._page._filterResults._ul.classList.remove("multi-select-mode");
      this._gallery._ul.classList.remove("multi-select-mode");

      this._clearSelection();
      // this.resetElements();
      this.dispatchEvent(new Event("multi-disabled"));

      this._editPanel.removeEventListener("attribute-is-filtered-on", (e) => {
         if (e.detail.names.length > 0) {
            // console.log("Setting this._requiresPrefetch = true");
            this._requiresPrefetch = true;
         } else {
            // console.log("Setting this._requiresPrefetch = false");
            this._requiresPrefetch = false;
         }
      });

   }

   _showSelectionPanel(val = true) {
      // this._editPanel._bulkEditModal._closeCallback();
      // // console.log(`this._warningConfirmation.hidden != true; && this._editPanel._prefetchBool.getValue() ${this._editPanel._warningConfirmation.hidden != true && this._editPanel._prefetchBool.getValue()} anndddasda ${this._editPanel._warningConfirmation.hidden != true} ${this._editPanel._prefetchBool.getValue()}`);
      // // if (this._editPanel._warningConfirmation.hidden != true && this._editPanel._prefetchBool.getValue()) {
      // //    this._page.loading.showSpinner();
      // //    return this._prefetch().then(() => {
      // //       this._page.loading.hideSpinner();
      // //       this._page.hideDimmer();
      // //    });
      // // } else {
      // this._page.hideDimmer();
      this._selectionPanel.show(val);
      // console.log("this._editMode.......... "+this._editMode)
      if (!this._editMode) this.startEditMode();
      // }

   }
   _showEditPanel(val = true) {
      // console.log("SHOW EDIT PANEL!");
      // console.log(this._page);
      // if (val) {
      // this._page.showDimmer();
      //    this._comparisonPanel.show(false);
      this._selectionPanel.show(true);
      // }
      // this._editPanel.hideShowTypes(this.setOfSelectedMetaIds);
      this._editPanel.show(true); //val
      // this._page._bulkEditModal.setAttribute("is-open", "true");
   }

   _showComparisonPanel(val = true) {
      if (val) {
         this._editPanel.show(false);
         this._selectionPanel.show(false);
      }

      this._editPanel.hideShowTypes(this.setOfSelectedMetaIds);
      let shownAttributes = this._editPanel.shownAttrNames();
      this._editPanel.toggleAttribute("hide");
      this._comparisonPanel.init({ columns: shownAttributes });

      if (typeof this._currentSelectionObjects !== "undefined" || this._currentSelectionObjects !== null) {
         this._comparisonPanel._refreshTable(this._currentSelectionObjects);
      }
      this._comparisonPanel.show(val);
   }

   _saveBulkEdit() {
      this._saveConfirmation();
   }

   // This feature was to compare the values of selected attributes and cards in a table
   // This never went live // triggers were hidden or disconnected
   _showMiniComparison(val = true) {
      this._editPanel.showComparison(val);
   }

   _saveConfirmation() {
      let button = document.createElement("button");
      button.setAttribute("class", "save-confirmation btn f1 text-semibold");
      let confirmText = document.createTextNode("Yes")
      button.appendChild(confirmText);

      let typeText = this._editType == "media" ? 'Media(s)' : 'Localization(s)';
      let text = `<h2 class="py-2 h3">Edit ${this._currentMultiSelection.size} ${typeText}?</h2>`;

      let inputValueArray = this._editPanel.getValue();

      let formData = [];
      for (let r of inputValueArray) {
         // Inputs are associated to multiple types
         // - If there are inputs for this types
         // - currentMultiSelectionToId maps the selected IDs to the TypeId
         // - There may be no selected items with that type
         if (r.typeId !== "") {
            // Are there any selected cards this MediaType?
            // - Note: To handle if we put info in an input, but no media selected to apply it to
            const mediaTypeInSelection = typeof this._currentMultiSelectionToId.get(Number(r.typeId)) !== "undefined" && this._currentMultiSelectionToId.get(Number(r.typeId)).size > 0;
            console.log("Is this media type in the selection? ...... "+mediaTypeInSelection);

            // What are the inputes related to this type?
            // - Note: To handle if we selected some media, but no input applies to it
            const inputShownForSelectedType = Object.entries(r.values).length > 0;
            // console.log("Are there input values? ...... "+inputShownForSelectedType);

            // We have inputs
            if (inputShownForSelectedType) {
               // and cards for this media

               if (mediaTypeInSelection) {
                  text += `<p class="py-2 text-bold text-gray">Update summary for ${this._currentMultiSelectionToId.get(Number(r.typeId)).size} ${typeText} with Type ID: ${r.typeId}</p>`;
               }

               for (let [name, value] of Object.entries(r.values)) {
                  if(mediaTypeInSelection) {
                     text += `<p class="py-2 px-2 ${mediaTypeInSelection ? 'text-gray' : 'text-red'}">- Change attribute '${name}' to value: <span class="text-italics ">${value}</span></p>`    
                  } else {
                     // inputs and no cards
                     text += `<p class="py-2 text-bold text-red">No update for Type ID: ${r.typeId} `;
                     text += `<p class="py-2 px-2 text-red text-italics"> - No items selected to change '${name}' to value: <span class="text-italics ">${value}</span></p></p>`;
                  }  
               }

               if (mediaTypeInSelection) {
                  // console.log("Making form data.......");
                  let formDataForType = {
                     attributes: r.values,
                     ids: Array.from(this._currentMultiSelectionToId.get(Number(r.typeId))) //Array.from(this._currentMultiSelection)
                  }
   
                  formData.push(formDataForType)               
               }


            } else {
               // no attribute, but cards are selected
               if (mediaTypeInSelection) {
                  text += `<p class="py-2 text-bold text-red">Update summary for ${this._currentMultiSelectionToId.get(Number(r.typeId)).size} ${typeText} with Type ID: ${r.typeId}</p>`
                  text += `<p class="py-2 px-2 text-red text-italics"> - Attribute does not exist on this type</p>`;
               } else {
                  // no attribute and no cards -- do nothing
               }
            }
               


            // } else {
            //    return text += `<p class="text-red py-2 px-2">- No valid values to update</p>`
            // }

            if (r.rejected !== {}) {
               for (let rej of Object.entries(r.rejected)) {
                  text += `<p class="text-red py-2 px-2">- Will not update attribute '${rej[0]}' - value is invalid, or null.</p>`
               }
            }
         }
      }

      // console.log(`formData.length = ${formData.length}`)
      // Save button is disabled if there are 0 total selected, so there should be formData - otherwise there was a bug
      if (formData.length == 0) {
         return this.boxHelper._modalError("Error with update: No selection found.", "Error");
      }

      let buttonContinue = document.createElement("button");
      buttonContinue.setAttribute("class", "btn f1 text-semibold");
      let confirmTextContinue = document.createTextNode("Select More")
      buttonContinue.appendChild(confirmTextContinue);

      let buttonExit = document.createElement("button");
      buttonExit.setAttribute("class", "btn  btn-charcoal btn-clear f1 text-semibold");
      
      let confirmTextExit = document.createTextNode("Exit Select Mode")
      buttonExit.appendChild(confirmTextExit);

      button.addEventListener("click", (e) => {
         this.handleEdit(e, formData);
      });

      buttonContinue.addEventListener("click", (e) => {
         this.boxHelper.modal._closeCallback();
         this._showSelectionPanel();
      });

      buttonExit.addEventListener("click", (e) => {
         this.boxHelper.modal._closeCallback();
         this._escapeEditMode();
      });

      this.boxHelper._modalConfirm({
         "titleText": `Confirm`,
         "mainText": text,
         "buttonSave": button,
         "scroll": false
      });
   }

   _patchMedia(formData) {
      return fetch(`/rest/Medias/${this._projectId}`, {
         method: "PATCH",
         mode: "cors",
         credentials: "include",
         body: JSON.stringify(formData),
         headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Accept": "application/json",
            "Content-Type": "application/json"
         }
      });
   }

   _patchLocalizations(formData) {
      return fetch(`/rest/Localizations/${this._projectId}`, {
         method: "PATCH",
         mode: "cors",
         credentials: "include",
         body: JSON.stringify(formData),
         headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Accept": "application/json",
            "Content-Type": "application/json"
         }
      });
   }

   handleEdit(e, formData) {
      if (this._editType == "media") {
         this._editMedia(e, formData);
      } else {
         this._editLocalization(e, formData);
      }
   }

   _editMedia(e, formData) {
      // button.addEventListener("click", (e) => {
      e.preventDefault();
      this.boxHelper.modal._closeCallback();
      this._page.showDimmer();
      this._page.loading.showSpinner();
      let promise = Promise.resolve();
      let text = "";
      let errorText = "";
      let respCode = 0;

      for (let jsonData of formData) {
         // console.log("jsonData-----------------------------------------------------------");
         // console.log(jsonData);

         if (jsonData.attributes !== {}) {
            promise = promise.then(() => this._patchMedia(jsonData)).then((resp) => {
               respCode = resp.status;
               // console.log(respCode);
               return resp.json();
            }).then((data) => {
               // console.log("Then reading message");
               if (respCode == "200") {
                  text += `${data.message} <br/><br/>`;
                  this.updateSelectionObjects(jsonData);
               } else {
                  errorText += `${data.message} <br/><br/>`;
                  // this.updateSelectionObjects(jsonData);            
               }

            });
         }
      }

      return promise.then(() => {
         console.log("Then clean up");
         this._editPanel.resetWidgets()
         this.dispatchEvent(new CustomEvent("bulk-attributes-edited", { detail: { editedIds: this._currentMultiSelection, editedObjs: this._currentSelectionObjects } }));
         this._clearSelection();
         this._page.loading.hideSpinner();
         this._page.hideDimmer();

         if (errorText === "" && text !== "") {
            this.boxHelper._modalSuccess(text);
         } else if (errorText !== "" && text === "") {
            this.boxHelper._modalError(errorText, "Error");
         } else if (errorText !== "" && text !== "") {
            this.boxHelper._modalError(`<p>${text}</p><p class="text-red">${errorText}</p>`);
         }

         // });  
      }).catch(err => {
         this._clearSelection();
         this._page.loading.hideSpinner();
         this._page.hideDimmer();
         return this.boxHelper._modalError("Error with update: " + err);
      });

      // });
   }

   _editLocalization(e, formData) {
      console.log("_editLocalization");
      // button.addEventListener("click", (e) => {
      e.preventDefault();
      this.boxHelper.modal._closeCallback();
      this._page.showDimmer();
      this._page.loading.showSpinner();
      let promise = Promise.resolve();
      let text = "";
      let errorText = "";
      let respCode = 0;

      for (let jsonData of formData) {
         // console.log(jsonData);
         promise = promise.then(() => this._patchLocalizations(jsonData)).then((resp) => {
            respCode = resp.status;
            // console.log(respCode);
            return resp.json();
         }).then((data) => {
            // console.log("Then reading message");
            if (respCode == "200") {
               text += `${data.message} <br/><br/>`;
               this.updateSelectionObjects(jsonData);
            } else {
               errorText += `${data.message} <br/><br/>`;
               // this.updateSelectionObjects(jsonData);            
            }

         });
      }

      return promise.then(() => {
         // console.log("Then clean up");
         this._editPanel.resetWidgets()
         this.dispatchEvent(new CustomEvent("bulk-attributes-edited", { detail: { editedIds: this._currentMultiSelection, editedObjs: this._currentSelectionObjects } }));
         this._clearSelection();
         this._page.loading.hideSpinner();
         this._page.hideDimmer();

         if (errorText === "" && text !== "") {
            console.log(this.boxHelper.modal);
            this.boxHelper._modalSuccess(text);
         } else if (errorText !== "" && text === "") {
            this.boxHelper._modalError(errorText, "Error");
         } else if (errorText !== "" && text !== "") {
            this.boxHelper._modalError(`<p>${text}</p><p class="text-red">${errorText}</p>`);
         }

         // });  
      }).catch(err => {
         this._clearSelection();
         this._page.loading.hideSpinner();
         this._page.hideDimmer();
         return this.boxHelper._modalError("Error with update: " + err);
      });

      // });
   }

   _updateShownAttributes({ typeId, values }) {
      // console.log(values);
      this._editPanel.setSelectionBoxValue({ typeId, values });
      // this._comparisonPanel.newColumns({ typeId, values });
   }

   updateSelectionObjects(formData) {
      for (let id of this._currentMultiSelection) {
         let newCardData = this._currentSelectionObjects.get(id);
         if (typeof newCardData !== "undefined") {
            if (formData.attributes) {
               for (let [a, b] of Object.entries(formData.attributes)) {
                  newCardData.attributes[a] = b;
               }
            }
            // console.log(newCardData);
            this._gallery.updateCardData(newCardData);
            if (this._page.cardData) {
               this._page.cardData.updateBulkCache(newCardData);
            } else if (this._page._mediaSection) {
               this._page._mediaSection.reload()
            }
         } else {
            console.warn("Possibly an error with save. Could not find ID in currentSelectionObjects.")
         }

      }
   }

   updateCardData(cardList) {
      this.elementList = cardList;
      let tmp = new Map();

      // The cardObj might have changes... this isn't a new list bc of pagination
      // Relevant to update re: Objects are used in comparison table
      // Also used to get type id, but that should not have been edited
      if (this._currentMultiSelection.size > 0) {
         for (let el of cardList) {
            if (this._currentMultiSelection.has(el.card.cardObj.id)) {
               tmp.set(el.card.cardObj.id, el.card.cardObj);
            }
         }
         this._currentSelectionObjects = tmp;
         this._comparisonPanel._refreshTable(this._currentSelectionObjects);
      }

   }

   checkForFilters(filterObj) {
      // This will stay up to date with any filter on the page
      let tmpArray = [];
      for (let filter of filterObj) {
         // console.log(`Filter found: ${filter}`)
         if (filter.categoryGroup === "Annotation" && !filter.field.startsWith("_")) {
            this.resultsFilter.containsAttributes = true;
            tmpArray.push(filter.field);
            // console.log(filter.field);
         }
      }
      this.resultsFilter.attributes = tmpArray;
      this.resultsFilter.filterObj = filterObj;
      this._editPanel.updateWarningList(this.resultsFilter);
   }

   async _prefetch() {
      // console.log("PREFETCH");
      // let condition = new FilterConditionData("", "results", "==", "true", "CACHED");
      // this._page._filterView.addCachedPill(condition);


      await this._page.cardData._bulkCaching(this._page._filterConditions);

      this._page.hideDimmer();
      this._selectionPanel.show(true);
      if (!this._editMode) this.startEditMode();
   }

   prefetchWarning() {
      // if (this._editMode) {
      //    // this._editPanel._warningShow();
      //    let buttonContinue = document.createElement("button")
      //    buttonContinue.setAttribute("class", "btn f1 text-semibold");
      //    buttonContinue.innerHTML = "Continue";
      //    buttonContinue.addEventListener("click", () => {
      //       this.boxHelper.modal._closeCallback();
      //       // this._page.loading.showSpinner();
      //       // this.prefetch.then(() => {
      //       //    this._page.loading.hideSpinner();
      //       //    this._page.gallery._paginator
      //       // });
      //    });

      //    let buttonExit = document.createElement("button")
      //    buttonExit.setAttribute("class", "btn btn-clear btn-charcoal f1 text-semibold");
      //    buttonExit.innerHTML = "Exit";
      //    buttonExit.addEventListener("click", () => {
      //       this.boxHelper.modal._closeCallback();
      //       this._escapeEditMode();
      //    });

      //    let names = "";
      //    for (let name of e.detail.names) {
      //       names += `'${name}'`;
      //    }
      //    this.boxHelper._modalWarningConfirm(`Current search results are filtered on ${names} attribute. Editing may change pagination.`, buttonExit, buttonContinue);
      // }
   }

}
customElements.define("entity-gallery-bulk-edit", GalleryBulkEdit);
