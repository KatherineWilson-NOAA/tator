class AnalyticsBreadcrumbs extends TatorElement {
  constructor() {
    super();

    const div = document.createElement("div");
    div.setAttribute("class", "annotation__breadcrumbs d-flex flex-items-center px-2 f3 text-gray");
    this._shadow.appendChild(div);

    this._projectText = document.createElement("a");
    this._projectText.setAttribute("class", "text-gray");
    div.appendChild(this._projectText);

    const chevron1 = document.createElement("chevron-right");
    chevron1.setAttribute("class", "px-2");
    div.appendChild(chevron1);

    this._analyticsText = document.createElement("a");
    this._analyticsText.setAttribute("class", "text-gray");
    div.appendChild(this._analyticsText);
  }

  static get observedAttributes() {
    return ["project-name", "analytics-name"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "project-name":
        this._projectText.textContent = newValue;
        this._projectText.setAttribute("href", this._detailUrl());
        break;
      case "analytics-name":
        this._analyticsText.textContent = newValue;
        break;
    }
  }

  _detailUrl() {
    const project = window.location.pathname.split("/")[1];
    return `${window.location.origin}/${project}/project-detail`;
  }
}

customElements.define("analytics-breadcrumbs", AnalyticsBreadcrumbs);
