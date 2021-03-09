class AnnotationsGallery extends EntityCardGallery {
  constructor() {
    super();
    /*
    * Add tools, headings and pagination for gallery here
    * 
    */

    // Custom width for annotations gallery
    this.colSize = 200;
    this._ul.style.gridTemplateColumns = `repeat(auto-fill,minmax(${this.colSize}px,1fr))`

    // Heading
    this._h3Text = document.createTextNode("All Annotations")
    this._h3.appendChild( this._h3Text );

    // Tools: Slider to resize images
    // this._resizeCards = document.createElement('entity-card-resize');
    // this._resizeCards._initGallery(this._ul, this.colSize);
    // this._tools.appendChild( this._resizeCards );

    this.panelContainer = null;

  }

  // Just do this the first time
  _initPanel({
    panelContainer
  }){
    this.panelContainer = panelContainer;
  }

  /* Init function to show and populate gallery w/ pagination */
  show({
    cardList = {}
  }){
    console.log(cardList);

    // Update Heading
    if(cardList.filterState.filtered == true) {
      this._ul.innerHTML = "";
      this._h3Text = document.createTextNode("Filtered Annotations");
    } else {
      this._ul.innerHTML = "";
      this._h3Text = document.createTextNode("All Annotations");
    }

    //Update descriptive count text
    this._p.innerHTML = `Annotations ${cardList.paginationState._start}-${cardList.paginationState._stop} of ${cardList.total}`;

    // Populate the pagination
    this._paginator.init({numFiles : cardList.total, paginationState : cardList.paginationState});

    // Append the cardList
    this.appendCardList(cardList.cards)
  }

  // Accepts a cardList object and appends each card to the page web component
  appendCardList(cardList, panelContainer){    
    for(let cardObj of cardList){
      let card = document.createElement("annotations-card");
      
      
      // Resize Tool needs to change style within card on change
      // this._resizeCards._slideInput.addEventListener("change", (e) => {
      //   let resizeValue = e.target.value;
      //   let resizeValuePerc = parseFloat( resizeValue / 100 );
      //   return card._img.style.height = `${130 * resizeValuePerc}px`;
      // });

      // init a side panel that can be triggered from card
      let annotationPanel = document.createElement("entity-attributes-panel");
      annotationPanel.init( cardObj, this.panelContainer );

      let annotationPanelDiv = document.createElement("div");
      annotationPanelDiv.setAttribute("class", "entity-panel--div")
      annotationPanelDiv.setAttribute("data-loc-id", cardObj.id)
      annotationPanelDiv.appendChild(annotationPanel);
      annotationPanelDiv.hidden = true;
      this.panelContainer.appendChild( annotationPanelDiv );

      annotationPanelDiv.addEventListener("unselected", () => {
        card._li.classList.remove("is-selected");
        annotationPanelDiv.hidden = true;
      });

      // init and append card
      card.init( cardObj, this.panelContainer, annotationPanelDiv);
      this._ul.appendChild(card);
    }
    return this._ul;
  }

}
    
customElements.define("annotations-gallery", AnnotationsGallery);
    