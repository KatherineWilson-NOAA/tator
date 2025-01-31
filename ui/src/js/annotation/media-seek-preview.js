import { TatorElement } from "../components/tator-element.js";
import { fetchRetry } from "../util/fetch-retry.js";
import { getCookie } from "../util/get-cookie.js";

export class MediaSeekPreview extends TatorElement {
   constructor() {
      super();

      this._previewBox = document.createElement('div');
      this._previewBox.setAttribute("class", "tooltip-seek-preview");
      this._previewBox.hidden = true;
      this._previewBox.style.userSelect = "none";
      this._shadow.appendChild(this._previewBox);

      const nameDiv = document.createElement('div');
      this._previewBox.appendChild(nameDiv);

      //  const nameLabel = document.createElement('span');
      //  nameLabel.textContent = "Filename: ";
      //  nameDiv.appendChild(nameLabel);

      this._frame = document.createElement('span');
      this._frame.setAttribute("class", "text-gray");
      this._time = document.createElement('span');
      this._time.setAttribute("class", "text-white");
      nameDiv.appendChild(this._time);
      nameDiv.appendChild(this._frame);
      

      // Image is aspirational
      //this._img = document.createElement('img');
      //this._img.setAttribute("style", "max-width: 100%;");
      //this._img.setAttribute("crossorigin", "anonymous");
      //this._previewBox.appendChild(this._img);
   }

   show() {
      this._previewBox.hidden = false;
   }

   hide() {
      this._previewBox.hidden = true;
   }

   set info(val) {
      if (this._info == val && val !== null && val !== -1) this.show();
      
      this._info = val;
      if (val !== null && val !== -1)
      {
         this._frame.textContent = `  (${val.frame})`;
         this._time.textContent = val.time;
         const pos = val.margin - (this._previewBox.clientWidth/2);
         this._previewBox.style.marginLeft = `${pos}px`;
         this.show();
      }
   }
}

customElements.define("media-seek-preview", MediaSeekPreview);
