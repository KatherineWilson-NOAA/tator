class RateControl extends TatorElement {
  constructor() {
    super();

    const summary = document.createElement("summary");
    summary.style.cursor = "pointer";
    summary.setAttribute("class", "annotation__setting d-flex flex-items-center px-3 rounded-1");
    this._shadow.appendChild(summary);

    const rateSpan = document.createElement("div");
    rateSpan.style.cursor="default";
    rateSpan.setAttribute("class", "text-gray");
    rateSpan.textContent = "Rate:";
    summary.appendChild(rateSpan);

    const div = document.createElement("div");
    div.setAttribute("class", "px-1");
    summary.appendChild(div);

    const select = document.createElement("select");
    select.setAttribute("class", "form-select has-border select-sm1");
    div.appendChild(select);
    this._select = select;

    const rates = [0.125, 0.25, 0.5, 1, 2, 4, 8, 16, 32];
    for (const rate of rates)
    {
      let option = document.createElement("option");
      option.setAttribute("value", rate);
      option.textContent = `${rate}x`;
      select.append(option);
    }
    select.selectedIndex = 3; //represents 1x

    select.addEventListener("change", evt => {
      const rate = Number(evt.target.value);
      this.dispatchEvent(new CustomEvent("rateChange", {
        detail: {rate: rate},
        composed: true
      }));
    });
  }

  static get observedAttributes() {
    return ["class", "disabled"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    switch (name) {
      case "disabled":
        if (newValue === null) {
          this._select.removeAttribute("disabled");
        } else {
          this._select.setAttribute("disabled", "");
        }
        break;
    }
  }
}

customElements.define("rate-control", RateControl);
