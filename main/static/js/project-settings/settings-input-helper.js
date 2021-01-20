/* Class with methods return input types with preset values for editing.*/
class SettingsInput {
  constructor(customClass, customColClass) {
    // Feature-related class(es) to customize form element. Applies to all elements.
    this.customClass = customClass || "";
  }

  /* Returns an input of type text with an initial value */
  inputText({
        value = '',
        customCol = 'col-8',
        labelText = '',
        type = 'text', // can also be HIDDEN
        name = ''
      } = {}
    ){
      const forId = this._getUniqueIdentifier(name);
      const inputTextElement = document.createElement("input");
      inputTextElement.setAttribute("type", type);
      inputTextElement.setAttribute("value", value);
      inputTextElement.setAttribute("name", name);
      inputTextElement.setAttribute("id", forId);

      const classes = `form-control input-monospace input-hide-webkit-autofill ${this.customClass} ${customCol}`
      inputTextElement.setAttribute("class", classes);

      if(labelText == null){
        return inputTextElement;
      } else {
        const inputWithLabel = this.labelWrap({
          "labelText": labelText,
          "inputNode": inputTextElement,
          "forId": forId
        });

        return inputWithLabel;
      }
  }

  arrayInputText({
    value = '',
    customCol = 'col-8',
    labelText = '',
    type = 'text', // can also be HIDDEN
    name = ''
  } = {}){
    const arrayInputDiv = document.createElement("div");
    // unique shared name for this set
    const forId = this._getUniqueIdentifier(name);

    // VALUE will be an array -- Loop the array and create TEXT INPUTS
    if(value.length > 0 ){
      for(let key in value){
        let showLabel = key == 0 ? labelText : "";
        // output smaller inputs into 3 cols
        let arrayInput = this.inputText({
            "value" : value[key],
            "labelText" : showLabel,
            "name" : name,
            "customCol" : 'col-2'
        });
        arrayInputDiv.appendChild(arrayInput);
      }
    } else {
      let arrayInput = this.inputText({
          "value" : "",
          "labelText" : labelText,
          "name" : name,
          "customCol" : 'col-2'
      });
      arrayInputDiv.appendChild(arrayInput);
    }

    // placeholder
    let placeholderNew = document.createElement("div");
    placeholderNew.setAttribute("class", "placeholderNew");
    arrayInputDiv.appendChild(placeholderNew);

    // Add new
    let addNewButton = this.addNewRow({
        "labelText" : "+ New",
        "callback" : ""
    });

    arrayInputDiv.appendChild(addNewButton);

    addNewButton.addEventListener("click", (event) => {
      event.preventDefault();
      let parentNode = event.target.parentNode.parentNode.parentNode;
      // Add another "+Add with input to the page"
      parentNode.querySelector(".placeholderNew").appendChild(
        this.inputText({
           "value" : "",
           "labelText" : "",
           "name" : name,
           "customCol" : 'col-2'
         })
       );
    });

    return arrayInputDiv;
  }

  // @TODO - Works but needs ovveride for label class
  inputRadioSlide({
    value = '',
    customCol = '',
    labelText = '',
    type = 'checkbox',
    name = ""
  } = {} ){
    const forId = this._getUniqueIdentifier(name);
    const slide = document.createElement("settings-bool-input");
    const fieldset = slide.getFieldSet( name, forId );
    slide.setLegendText(labelText);
    slide.setOnLabel("Yes");
    slide.setOffLabel("No");
    slide.setValue(value);

    return fieldset;
  }

  multipleCheckboxes({
    value = '',
    labelText = '',
    name = '',
    checkboxList = ''
  } = {}){
    const setName = this._getUniqueIdentifier(name);
    const checkboxes = document.createElement("div");
    checkboxes.setAttribute("class", `col-8`);

    const checkboxInner = document.createElement("div");
    checkboxInner.setAttribute("class", `d-flex flex-row flex-wrap flex-justify-between`);

    for(let data of checkboxList){
      checkboxInner.appendChild( this._miniCheckboxSet(data, setName) );
    }

    checkboxes.appendChild(checkboxInner);

    const checkboxesWithLabel = this.labelWrap({
      "labelText": labelText,
      "inputNode": checkboxes,
      "labelElement" : "fieldset"
    });

    return checkboxesWithLabel;
  }

  _miniCheckboxSet(data, setName){
    // Outputs inputs in rows of three
    let miniCheckboxSet = document.createElement("label");
    miniCheckboxSet.setAttribute("class", "col-6 py-2");

    let checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.setAttribute("value", data.id);
    checkbox.setAttribute("name", setName);
    checkbox.setAttribute("class", "checkbox");

    if (data.checked) checkbox.checked = true;

    miniCheckboxSet.appendChild(checkbox);

    let textSpan = document.createElement("span");
    textSpan.setAttribute("class", "px-2 v-align-top");

    let labelText = document.createTextNode(data.name);
    textSpan.appendChild(labelText);
    miniCheckboxSet.appendChild(textSpan)

    return miniCheckboxSet;
  }



  /* Returns a select with options from array */
  inputSelectOptions({
    value = "", //current value
    labelText = "",
    customCol = "col-8",
    optionsList = [],
    disabledInput = false,
    name = ""
    } = {}
  ){
    if(optionsList === null || Array.isArray(optionsList) === false){
      return console.error("FormsHelper Error: Array type required to init select dropdown.");
    } else {
      const setName =this._getUniqueIdentifier(name);
      const inputSelect = document.createElement("select");
      const currentValue = value;

      inputSelect.setAttribute("class", this.customClass + " form-select select-md " + customCol);
      inputSelect.setAttribute("name", name);

      if(!disabledInput) inputSelect.style.color = "#fff";
      //
      for(let optionValue of optionsList){
        let inputOption = document.createElement("option");
        let optionText = document.createTextNode(optionValue.optText);
        let indexValue = optionValue.optValue;

        // Select Text
        inputOption.appendChild(optionText);

        // Select Value
        if(typeof indexValue == "undefined" && typeof currentValue == "undefined"){
          inputOption.value = ""; // ie. Nothing is selected...
        } else {
          inputOption.value = indexValue;

          if(indexValue == currentValue) {
            inputOption.setAttribute("selected", true);
            inputOption.checked = true;
            inputOption.selected = true;
          }
        }

        if(disabledInput) inputSelect.disabled = true;

        inputSelect.appendChild(inputOption);
      }

      const inputWithLabel = this.labelWrap({
        "labelText": labelText,
        "inputNode": inputSelect,
        "disabled" : disabledInput
      });

      return inputWithLabel;
    }
  }

  editImageUpload({
    value = "", // img path
    imgEl = document.createElement("img"),
    labelText = "",
    customCol = "col-8",
    disabledInput = false
    } = {}){
      const setName = this._getUniqueIdentifier(name);
      let editButton = this.editButton({"customClass" : "btn-edit-overlay btn-small", "name" : "thumb"});

      imgEl.style.height = "84px";
      imgEl.style.width = "84px";
      imgEl.title = labelText;
      imgEl.setAttribute("class", "projects__image py-4");

      if(value != null){
        imgEl.src = value;
      } else {
        imgEl.src = "/static/images/cvision-logo-svg.svg";
      }

      const inputWithLabel = this.labelWrap({
        "labelText": labelText,
        "inputNode": imgEl,
        "name": setName,
        "labelElement": "div"
      });

      inputWithLabel.appendChild(editButton);
      inputWithLabel.style.position = "relative";

      return inputWithLabel;
    }


  /* Wraps any node in a label */
  labelWrap({
      labelText = '',
      disabled = false,
      labelElement = "label",
      forId = "",
      labelType = "label",
      inputNode //required
    } = {}
    ){
      let labelWrap = "";
      labelWrap = document.createElement(labelType);
      labelWrap.setAttribute("for", forId);
      labelWrap.setAttribute("class", "d-flex flex-items-center py-1 position-relative f2");

      const spanTextNode = document.createElement("span");
      spanTextNode.setAttribute("class", `col-4 ${(disabled) ? "text-gray" : ""}`);
      labelWrap.append(spanTextNode);

      const spanText = document.createTextNode("");
      spanText.nodeValue = labelText;
      spanTextNode.appendChild(spanText);

      const labelDiv = document.createElement("div");
      labelDiv.setAttribute("class", "py-2 px-2 f2");
      labelDiv.appendChild(labelWrap);

      labelWrap.append(inputNode);

      return labelDiv;
    }

    addNewRow({
        labelText = '',
        callback = null
      } = {}){
        const labelWrap = document.createElement("label");
        labelWrap.setAttribute("class", "d-flex flex-items-center py-1 position-relative f2");

        const spanTextNode = document.createElement("span");
        const spanText = document.createTextNode("");
        const labelDiv = document.createElement("div");

        spanTextNode.setAttribute("class", "col-4 text-gray clickable");
        spanText.nodeValue = labelText;
        spanTextNode.appendChild(spanText);

        labelWrap.append(spanTextNode);

        labelDiv.setAttribute("class", "py-2 px-2 f2");
        labelDiv.appendChild(labelWrap);

        return labelDiv;
      }

    /* Edit button */
    editButton({
      text = "Edit",
      customClass = "",
      forId = ""
    } = {}){
    //<input type="submit" value="Save" class="btn btn-charcoal btn-clear text-semibold">
      const button = document.createElement("label");
      button.setAttribute("for", forId);
      button.append(text);
      button.setAttribute("class", `btn btn-clear btn-charcoal text-semibold ${customClass} position-relative`);

      return button;
    }

    /* Returns an number input with an initial value */
    saveButton({ text = "Save"} = {}){
      const inputSubmit = document.createElement("input");
      inputSubmit.setAttribute("type", "submit");
      inputSubmit.setAttribute("value", text);
      inputSubmit.setAttribute("class", `btn btn-clear f2 text-semibold`);

      return inputSubmit;
    }

    /* Returns an number input with an initial value */
    resetLink({ text = "Reset"} = {}){
      const resetLink = document.createElement("a");
      resetLink.setAttribute("href", "#");
      resetLink.setAttribute("class", `px-5 f2 text-gray hover-text-white`);

      let resetLinkText = document.createTextNode(text);
      resetLink.appendChild( resetLinkText );

      return resetLink;
    }

   _getUniqueIdentifier(someText){
      return `${someText.replace(/[^\w]|_/g, "").toLowerCase()}-${Math.floor(Math.random() * 1000)}`;
    }

}
