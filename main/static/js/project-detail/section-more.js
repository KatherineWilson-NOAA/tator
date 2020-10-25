class SectionMore extends TatorElement {
  constructor() {
    super();

    const details = document.createElement("details");
    details.setAttribute("class", "position-relative");
    this._shadow.appendChild(details);

    const summary = document.createElement("summary");
    summary.setAttribute("class", "btn-clear h2 text-gray hover-text-white");
    details.appendChild(summary);

    const moreIcon = document.createElement("more-icon");
    summary.appendChild(moreIcon);

    const styleDiv = document.createElement("div");
    styleDiv.setAttribute("class", "files__main files-wrap");
    details.appendChild(styleDiv);

    this._div = document.createElement("div");
    this._div.setAttribute("class", "more d-flex flex-column f2");
    styleDiv.appendChild(this._div);

    this._algorithmMenu = document.createElement("algorithm-menu");
    this._div.appendChild(this._algorithmMenu);

    const otherButtons = document.createElement("div");
    otherButtons.setAttribute("class", "d-flex flex-column px-4 py-3 lh-condensed");
    this._div.appendChild(otherButtons);

    this._download = document.createElement("download-button");
    this._download.setAttribute("text", "Download files");
    otherButtons.appendChild(this._download);

    this._annotations = document.createElement("download-button");
    this._annotations.setAttribute("text", "Download metadata");
    otherButtons.appendChild(this._annotations);

    this._rename = document.createElement("rename-button");
    this._rename.setAttribute("text", "Rename section");
    otherButtons.appendChild(this._rename);

    this._deleteSection = document.createElement("delete-button");
    this._deleteSection.init("Delete section");
    otherButtons.appendChild(this._deleteSection);

    this._deleteMedia = document.createElement("delete-button");
    this._deleteMedia.init("Delete media", "text-red");
    otherButtons.appendChild(this._deleteMedia);

    this._algorithmMenu.addEventListener("click", () => {
      details.removeAttribute("open");
    });

    this._download.addEventListener("click", () => {
      details.removeAttribute("open");
      this.dispatchEvent(new Event("download"));
    });

    this._annotations.addEventListener("click", () => {
      details.removeAttribute("open");
      this.dispatchEvent(new Event("downloadAnnotations"));
    });

    this._rename.addEventListener("click", evt => {
      details.removeAttribute("open");
      this.dispatchEvent(new Event("rename", {composed: true}));
    });

    this._deleteSection.addEventListener("click", evt => {
      details.removeAttribute("open");
      this.dispatchEvent(new Event("deleteSection", {composed: true}));
    });

    this._deleteMedia.addEventListener("click", evt => {
      details.removeAttribute("open");
      this.dispatchEvent(new Event("deleteMedia", {composed: true}));
    });
  }

  set section(val) {
    if (val === null) {
      this._rename.style.display = "none";
      this._deleteSection.style.display = "none";
      this._deleteMedia.style.display = "none";
    } else {
      this._rename.style.display = "block";
      this._deleteSection.style.display = "block";
      this._deleteMedia.style.display = "block";
    }
  }

  set permission(val) {
    if (!hasPermission(val, "Can Execute")) {
      this._algorithmMenu.style.display = "none";
    }
    if (!hasPermission(val, "Can Transfer")) {
      this._download.style.display = "none";
      this._annotations.style.display = "none";
      this._deleteSection.style.display = "none";
      this._deleteMedia.style.display = "none";
    }
    if (!hasPermission(val, "Can Edit")) {
      this._rename.style.display = "none";
    }
  }

  set algorithms(val) {
    this._algorithmMenu.algorithms = val;
  }
}

customElements.define("section-more", SectionMore);
