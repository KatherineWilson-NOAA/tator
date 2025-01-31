import { ModalDialog } from "./modal-dialog.js";

export class UploadDialog extends ModalDialog {
  constructor() {
    super();

    this._title.nodeValue = "Uploading Files";

    this._fileText = document.createElement("h3");
    this._fileText.setAttribute("class", "text-center text-semibold py-3");
    this._main.appendChild(this._fileText);

    this._fileProgress = document.createElement("progress");
    this._fileProgress.setAttribute("class", "progress");
    this._main.appendChild(this._fileProgress);

    const spacer = document.createElement("div");
    spacer.setAttribute("class", "py-3");
    this._main.appendChild(spacer);

    this._uploadText = document.createElement("h3");
    this._uploadText.setAttribute("class", "text-center text-semibold py-3");
    this._main.appendChild(this._uploadText);

    this._uploadProgress = document.createElement("progress");
    this._uploadProgress.setAttribute("max", 100);
    this._uploadProgress.setAttribute("class", "progress");
    this._main.appendChild(this._uploadProgress);

    this._errors = document.createElement("ul");
    this._errors.setAttribute("class", "modal__errors d-flex flex-column");
    this._main.appendChild(this._errors);

    this._cancel = document.createElement("button");
    this._cancel.setAttribute("class", "btn btn-clear btn-red");
    this._cancel.textContent = "Cancel";
    this._footer.appendChild(this._cancel);

    this._close = document.createElement("button");
    this._close.setAttribute("class", "btn btn-clear btn-purple");
    this._close.textContent = "Close";
    this._close.style.display = "none";
    this._footer.appendChild(this._close);

    this._cancel.addEventListener("click", () => {
      this.removeAttribute("is-open");
      this._cancelled = true;
      this.dispatchEvent(new Event("cancel"));
      this.reset();
    });

    this._close.addEventListener("click", () => {
      this.removeAttribute("is-open");
      this.dispatchEvent(new Event("close"));
      this.reset();
    });

    this._doneFiles = 0;
    this._failFiles = 0;
  }

  static get observedAttributes() {
    return ModalDialog.observedAttributes;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    ModalDialog.prototype.attributeChangedCallback.call(this, name, oldValue, newValue);
    switch (name) {
      case "is-open":
        break;
    }
  }

  setTotalFiles(numFiles) {
    this._cancelled = false;
    this._fileProgress.setAttribute("max", numFiles);
    this._totalFiles = numFiles;
    this._fileText.textContent = `Uploaded 0/${this._totalFiles} Files`;
  }

  uploadFinished() {
    this._doneFiles++;
    this.fileComplete();
  }

  setProgress(percent, message) {
    this._uploadProgress.setAttribute("value", percent);
    this._uploadText.textContent = message;
  }

  addError(message) {
    this._failFiles++;
    const li = document.createElement("li");
    this._errors.appendChild(li);

    const div = document.createElement("div");
    div.setAttribute("class", "d-flex flex-items-center py-4 text-semibold");
    li.appendChild(div);

    const icon = document.createElement("modal-warning");
    icon.setAttribute("class", "px-2");
    div.appendChild(icon);

    const text = document.createTextNode(message);
    div.appendChild(text);

    this.fileComplete();
  }

  fileComplete() {
    this._fileProgress.setAttribute("value", this._doneFiles + this._failFiles);
    this._fileText.textContent = `Uploaded ${this._doneFiles}/${this._totalFiles} Files`;
    if (this._failFiles > 0) {
      this._fileText.textContent += ` (${this._failFiles} Failed)`
    }
    if (this._doneFiles + this._failFiles == this._totalFiles) {
      this.finish();
    }
  }

  finish() {
    if (!this._cancelled) {
      this._cancel.style.display = "none";
      this._close.style.display = "flex";
      if (this._failFiles == 0) {
        this._uploadText.textContent = "Upload complete! Monitor video transcodes with the \"Activity\" button.";
        this._title.nodeValue = "Upload Complete!";
      } else {
        this._uploadText.textContent = "Upload failure! See errors below.";
        this._title.nodeValue = "Upload Failure!";
      }
    }
  }

  reset() {
    this._cancel.style.display = "flex";
    this._close.style.display = "none";
    this._title.nodeValue = "Uploading Files";
    this._fileText.textContent = "";
    this._fileProgress.setAttribute("value", 0);
    this._uploadText.textContent = "";
    this._uploadProgress.setAttribute("value", 0);
    this._doneFiles = 0;
    
    while (this._errors.firstChild) {
      this._errors.removeChild(this._errors.firstChild);
    }
  }
}

customElements.define("upload-dialog", UploadDialog);
