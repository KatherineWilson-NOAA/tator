class QualityControl extends TatorElement {
  constructor() {
    super();

    const summary = document.createElement("div");
    summary.style.cursor = "pointer";
    summary.setAttribute("class", "d-flex flex-items-center rounded-1");
    this._shadow.appendChild(summary);

    this._div = document.createElement("div");
    this._div.setAttribute("class", "px-1");
    summary.appendChild(this._div);

    let advancedSettings = document.createElement("button");
    advancedSettings.setAttribute("class", "btn-clear d-flex rounded-1 f2 text-gray hover-text-white");
    summary.appendChild(advancedSettings);
    this._advancedSettings = advancedSettings;

    const advancedSettingsSvg = document.createElementNS(svgNamespace, "svg");
    advancedSettingsSvg.setAttribute("id", "icon-advanced-video-settings");
    advancedSettingsSvg.setAttribute("viewBox", "0 0 24 24");
    advancedSettingsSvg.setAttribute("height", "1em");
    advancedSettingsSvg.setAttribute("width", "1em");
    advancedSettings.appendChild(advancedSettingsSvg);

    const advancedSettingsTitle = document.createElementNS(svgNamespace, "title");
    advancedSettingsTitle.textContent = "Advanced Video Settings";
    advancedSettingsSvg.appendChild(advancedSettingsTitle);
    const advancedSettingsPath = document.createElementNS(svgNamespace, "path");
    advancedSettingsPath.setAttribute("d", "M16 12c0-0.54-0.108-1.057-0.303-1.53-0.203-0.49-0.5-0.93-0.868-1.298s-0.809-0.666-1.299-0.869c-0.473-0.195-0.99-0.303-1.53-0.303s-1.057 0.108-1.53 0.303c-0.49 0.203-0.93 0.5-1.298 0.868s-0.666 0.809-0.869 1.299c-0.195 0.473-0.303 0.99-0.303 1.53s0.108 1.057 0.303 1.53c0.203 0.49 0.5 0.93 0.868 1.298s0.808 0.665 1.298 0.868c0.474 0.196 0.991 0.304 1.531 0.304s1.057-0.108 1.53-0.303c0.49-0.203 0.93-0.5 1.298-0.868s0.665-0.808 0.868-1.298c0.196-0.474 0.304-0.991 0.304-1.531zM14 12c0 0.273-0.054 0.53-0.151 0.765-0.101 0.244-0.25 0.464-0.435 0.65s-0.406 0.334-0.65 0.435c-0.234 0.096-0.491 0.15-0.764 0.15s-0.53-0.054-0.765-0.151c-0.244-0.101-0.464-0.25-0.65-0.435s-0.334-0.406-0.435-0.65c-0.096-0.234-0.15-0.491-0.15-0.764s0.054-0.53 0.151-0.765c0.101-0.244 0.25-0.464 0.435-0.65s0.406-0.334 0.65-0.435c0.234-0.096 0.491-0.15 0.764-0.15s0.53 0.054 0.765 0.151c0.244 0.101 0.464 0.25 0.65 0.435s0.334 0.406 0.435 0.65c0.096 0.234 0.15 0.491 0.15 0.764zM20.315 15.404c0.046-0.105 0.112-0.191 0.192-0.257 0.057-0.047 0.122-0.084 0.19-0.109 0.066-0.024 0.139-0.038 0.213-0.038h0.090c0.405 0 0.793-0.081 1.148-0.228 0.368-0.152 0.698-0.375 0.974-0.651s0.499-0.606 0.651-0.974c0.146-0.354 0.227-0.742 0.227-1.147s-0.081-0.793-0.228-1.148c-0.152-0.368-0.375-0.698-0.651-0.974s-0.606-0.499-0.974-0.651c-0.354-0.146-0.742-0.227-1.147-0.227h-0.159c-0.11-0.001-0.215-0.028-0.308-0.076-0.066-0.034-0.125-0.079-0.174-0.133-0.047-0.050-0.087-0.11-0.117-0.179-0.003-0.029-0.004-0.059-0.004-0.089-0.046-0.106-0.064-0.219-0.054-0.328 0.006-0.074 0.025-0.146 0.056-0.213 0.029-0.064 0.071-0.126 0.118-0.174l0.062-0.062c0.286-0.286 0.503-0.618 0.65-0.973 0.152-0.368 0.228-0.759 0.228-1.149s-0.076-0.781-0.229-1.149c-0.147-0.355-0.365-0.686-0.653-0.974-0.286-0.286-0.618-0.503-0.973-0.65-0.368-0.152-0.759-0.228-1.149-0.228s-0.782 0.077-1.15 0.229c-0.355 0.147-0.686 0.365-0.972 0.651l-0.046 0.047c-0.083 0.080-0.183 0.136-0.288 0.166-0.072 0.020-0.146 0.028-0.219 0.023-0.071-0.005-0.143-0.022-0.218-0.055-0.101-0.044-0.187-0.11-0.253-0.19-0.047-0.057-0.084-0.122-0.109-0.19-0.025-0.067-0.039-0.14-0.039-0.214v-0.090c0-0.405-0.081-0.793-0.228-1.148-0.152-0.368-0.375-0.698-0.651-0.974s-0.606-0.499-0.974-0.651c-0.354-0.146-0.742-0.227-1.147-0.227s-0.793 0.081-1.148 0.228c-0.368 0.152-0.698 0.375-0.974 0.651s-0.498 0.606-0.65 0.973c-0.147 0.355-0.228 0.743-0.228 1.148v0.159c-0.001 0.11-0.028 0.215-0.076 0.308-0.034 0.066-0.079 0.125-0.133 0.174-0.050 0.047-0.11 0.087-0.179 0.117-0.029 0.003-0.059 0.004-0.089 0.004-0.106 0.046-0.219 0.064-0.328 0.054-0.075-0.006-0.147-0.025-0.214-0.055-0.064-0.030-0.126-0.071-0.174-0.118l-0.062-0.062c-0.286-0.286-0.618-0.503-0.973-0.65-0.368-0.152-0.759-0.228-1.149-0.228s-0.781 0.077-1.149 0.229c-0.354 0.147-0.686 0.365-0.973 0.653-0.286 0.286-0.503 0.618-0.65 0.973-0.152 0.368-0.228 0.759-0.228 1.149s0.077 0.781 0.229 1.149c0.147 0.354 0.365 0.686 0.651 0.971l0.047 0.047c0.080 0.083 0.136 0.183 0.166 0.288 0.020 0.072 0.028 0.146 0.023 0.219-0.005 0.071-0.022 0.143-0.054 0.215-0.006 0.016-0.013 0.034-0.021 0.052-0.041 0.109-0.108 0.203-0.191 0.275-0.057 0.049-0.12 0.087-0.189 0.114-0.066 0.026-0.139 0.041-0.194 0.043h-0.090c-0.405 0-0.793 0.081-1.148 0.228-0.367 0.152-0.697 0.375-0.973 0.651s-0.499 0.606-0.651 0.974c-0.147 0.354-0.228 0.742-0.228 1.147s0.081 0.793 0.228 1.148c0.152 0.368 0.375 0.698 0.651 0.974s0.606 0.499 0.974 0.651c0.354 0.146 0.742 0.227 1.147 0.227h0.159c0.11 0.001 0.215 0.028 0.308 0.076 0.066 0.034 0.125 0.079 0.174 0.133 0.048 0.052 0.089 0.113 0.121 0.188 0.046 0.106 0.064 0.219 0.054 0.328-0.006 0.074-0.025 0.146-0.056 0.213-0.029 0.064-0.071 0.126-0.118 0.174l-0.062 0.062c-0.286 0.286-0.503 0.618-0.65 0.973-0.152 0.368-0.228 0.759-0.228 1.149s0.076 0.781 0.229 1.149c0.147 0.355 0.365 0.686 0.653 0.974 0.286 0.286 0.618 0.503 0.973 0.65 0.368 0.152 0.759 0.228 1.149 0.228s0.781-0.076 1.149-0.229c0.355-0.147 0.686-0.365 0.972-0.651l0.047-0.048c0.083-0.080 0.183-0.136 0.288-0.166 0.072-0.020 0.146-0.028 0.219-0.023 0.071 0.005 0.143 0.022 0.215 0.054 0.016 0.006 0.034 0.013 0.052 0.021 0.109 0.041 0.203 0.108 0.275 0.191 0.049 0.056 0.087 0.12 0.114 0.189 0.025 0.066 0.041 0.139 0.042 0.194v0.091c0 0.405 0.081 0.793 0.228 1.148 0.152 0.368 0.375 0.698 0.651 0.974s0.606 0.499 0.974 0.651c0.355 0.146 0.743 0.227 1.148 0.227s0.793-0.081 1.148-0.228c0.368-0.152 0.698-0.375 0.974-0.651s0.499-0.606 0.651-0.974c0.147-0.355 0.228-0.743 0.228-1.148v-0.159c0.001-0.11 0.028-0.215 0.076-0.308 0.034-0.066 0.079-0.125 0.133-0.174 0.052-0.048 0.113-0.089 0.188-0.121 0.106-0.046 0.219-0.064 0.328-0.054 0.074 0.006 0.146 0.025 0.213 0.056 0.064 0.029 0.126 0.071 0.174 0.118l0.062 0.062c0.286 0.286 0.618 0.503 0.973 0.65 0.368 0.152 0.759 0.228 1.149 0.228s0.781-0.076 1.149-0.229c0.355-0.147 0.686-0.365 0.974-0.653 0.286-0.286 0.503-0.618 0.65-0.973 0.152-0.368 0.228-0.759 0.228-1.149s-0.076-0.781-0.229-1.149c-0.147-0.355-0.365-0.686-0.651-0.972l-0.048-0.047c-0.080-0.083-0.136-0.183-0.166-0.288-0.020-0.072-0.028-0.146-0.023-0.219 0.005-0.071 0.022-0.143 0.054-0.215zM18.485 14.596c-0.126 0.285-0.198 0.582-0.219 0.88-0.022 0.307 0.011 0.612 0.092 0.901 0.119 0.423 0.341 0.814 0.652 1.137l0.072 0.073c0.098 0.097 0.169 0.207 0.218 0.324 0.050 0.122 0.076 0.252 0.076 0.384s-0.025 0.262-0.076 0.384c-0.048 0.116-0.12 0.226-0.217 0.324-0.099 0.099-0.209 0.17-0.325 0.219-0.122 0.050-0.252 0.076-0.384 0.076s-0.262-0.025-0.384-0.076c-0.116-0.048-0.226-0.12-0.324-0.217l-0.061-0.061c-0.23-0.226-0.484-0.398-0.755-0.522-0.28-0.128-0.577-0.205-0.876-0.23-0.437-0.037-0.882 0.034-1.293 0.212-0.281 0.12-0.535 0.288-0.753 0.49-0.224 0.208-0.408 0.451-0.547 0.717-0.193 0.371-0.298 0.785-0.303 1.211v0.181c0 0.137-0.027 0.266-0.075 0.382-0.050 0.122-0.125 0.232-0.218 0.325s-0.203 0.167-0.325 0.218c-0.114 0.045-0.243 0.072-0.38 0.072s-0.266-0.027-0.382-0.075c-0.122-0.050-0.232-0.125-0.325-0.218s-0.167-0.203-0.218-0.325c-0.048-0.116-0.075-0.245-0.075-0.382v-0.090c-0.008-0.335-0.069-0.635-0.176-0.914-0.111-0.287-0.27-0.55-0.467-0.777-0.284-0.328-0.646-0.585-1.058-0.745-0.277-0.119-0.566-0.187-0.854-0.208-0.307-0.022-0.612 0.011-0.901 0.092-0.423 0.119-0.814 0.341-1.137 0.652l-0.073 0.072c-0.099 0.098-0.208 0.17-0.325 0.218-0.122 0.050-0.252 0.076-0.384 0.076s-0.262-0.025-0.384-0.076c-0.116-0.048-0.226-0.12-0.324-0.217-0.099-0.099-0.17-0.209-0.219-0.325-0.050-0.122-0.076-0.252-0.076-0.384s0.025-0.262 0.076-0.384c0.048-0.116 0.12-0.226 0.217-0.324l0.061-0.061c0.226-0.23 0.398-0.484 0.522-0.755 0.128-0.28 0.205-0.577 0.23-0.876 0.037-0.437-0.034-0.882-0.212-1.293-0.12-0.281-0.288-0.535-0.49-0.753-0.208-0.225-0.451-0.408-0.717-0.547-0.371-0.193-0.785-0.298-1.211-0.303l-0.178 0.002c-0.137 0-0.266-0.027-0.382-0.075-0.122-0.050-0.232-0.125-0.325-0.218s-0.167-0.203-0.218-0.325c-0.048-0.116-0.075-0.245-0.075-0.382s0.027-0.266 0.075-0.382c0.050-0.122 0.125-0.232 0.218-0.325s0.203-0.167 0.325-0.218c0.116-0.048 0.245-0.075 0.382-0.075h0.090c0.335-0.008 0.635-0.069 0.914-0.176 0.287-0.111 0.55-0.27 0.777-0.467 0.328-0.284 0.585-0.646 0.745-1.058 0.119-0.277 0.187-0.566 0.208-0.854 0.022-0.307-0.011-0.612-0.092-0.901-0.119-0.425-0.341-0.816-0.652-1.138l-0.073-0.073c-0.097-0.098-0.169-0.207-0.217-0.324-0.051-0.121-0.076-0.252-0.077-0.383s0.025-0.262 0.076-0.384c0.048-0.116 0.12-0.226 0.217-0.324 0.099-0.098 0.208-0.17 0.325-0.218 0.121-0.051 0.252-0.076 0.383-0.077s0.262 0.025 0.384 0.076c0.116 0.048 0.226 0.12 0.324 0.217l0.061 0.061c0.23 0.226 0.484 0.398 0.755 0.522 0.28 0.128 0.577 0.205 0.876 0.23 0.37 0.032 0.745-0.014 1.101-0.137 0.096-0.012 0.187-0.037 0.269-0.073 0.285-0.122 0.539-0.289 0.757-0.491 0.225-0.208 0.408-0.451 0.547-0.717 0.192-0.37 0.297-0.785 0.302-1.21v-0.181c0-0.137 0.027-0.266 0.075-0.382 0.050-0.122 0.125-0.232 0.218-0.325s0.203-0.167 0.325-0.218c0.116-0.048 0.245-0.075 0.382-0.075s0.266 0.027 0.382 0.075c0.122 0.050 0.232 0.125 0.325 0.218s0.167 0.203 0.218 0.325c0.048 0.116 0.075 0.245 0.075 0.382v0.090c0.001 0.314 0.056 0.613 0.157 0.892 0.104 0.288 0.256 0.552 0.447 0.783 0.266 0.323 0.607 0.581 0.996 0.751 0.281 0.124 0.579 0.196 0.876 0.217 0.307 0.022 0.612-0.011 0.901-0.092 0.423-0.119 0.814-0.341 1.137-0.652l0.073-0.072c0.097-0.098 0.207-0.169 0.324-0.218 0.122-0.050 0.252-0.076 0.384-0.076s0.262 0.025 0.384 0.076c0.116 0.048 0.226 0.12 0.324 0.217 0.099 0.099 0.17 0.209 0.219 0.325 0.050 0.122 0.076 0.252 0.076 0.384s-0.025 0.262-0.076 0.384c-0.048 0.116-0.12 0.226-0.217 0.324l-0.061 0.061c-0.226 0.23-0.398 0.484-0.522 0.755-0.128 0.28-0.205 0.577-0.23 0.876-0.032 0.37 0.014 0.745 0.137 1.101 0.012 0.096 0.037 0.187 0.073 0.269 0.122 0.285 0.289 0.539 0.491 0.757 0.208 0.224 0.451 0.408 0.717 0.547 0.371 0.193 0.785 0.298 1.211 0.303l0.179-0.002c0.137 0 0.266 0.027 0.382 0.075 0.122 0.050 0.232 0.125 0.325 0.218s0.167 0.203 0.218 0.325c0.048 0.116 0.075 0.245 0.075 0.382s-0.027 0.266-0.075 0.382c-0.050 0.122-0.125 0.232-0.218 0.325s-0.203 0.167-0.325 0.218c-0.116 0.048-0.245 0.075-0.382 0.075h-0.090c-0.314 0.001-0.613 0.056-0.892 0.157-0.288 0.104-0.552 0.256-0.783 0.447-0.323 0.266-0.581 0.607-0.75 0.993z");
    advancedSettingsSvg.appendChild(advancedSettingsPath);

    // handle default
    const searchParams = new URLSearchParams(window.location.search);
    this._quality = 720;
    if (searchParams.has("playQuality"))
    {
      this._quality = Number(searchParams.get("playQuality"));
    }

    this._select = null;

    advancedSettings.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent("openVideoSettings", {
        composed: true
      }));
    });
  }

  hide()
  {
    this.style.visibility = 'hidden';
  }

  show()
  {
    this.style.visibility = 'visible';
  }

  hideAdvanced()
  {
    this._advancedSettings.style.visibility = 'hidden';
  }

  showAdvanced()
  {
    this._advancedSettings.style.visibility = 'visible';
  }


  set quality(quality)
  {
    this._quality = quality;

    let params = new URLSearchParams(document.location.search.substring(1));
    params.set("playQuality", quality);
    const path = document.location.pathname;
    const searchArgs = params.toString();
    var newUrl = path;
    newUrl += "?" + searchArgs;

    window.history.replaceState(quality,"playQuality",newUrl);
    this.dispatchEvent(new CustomEvent("setQuality",
    {
      composed: true,
      detail: {
        quality: quality
      }
    }
    ));

    for (let index = 0; index < this._select.options.length; index++)
    {
      const option = this._select.options[index];
      if (option.textContent == `${quality}p`)
      {
        this._select.selectedIndex = index;
        break;
      }
    }
  }

  set resolutions(resolutions)
  {
    const select = document.createElement("select");
    select.setAttribute("class", "form-select has-border select-sm1");
    this._select = select;

    let closest_idx = 0;
    let max_diff = Number.MAX_SAFE_INTEGER;
    resolutions.sort((a, b) => a - b);
    for (let idx = 0; idx < resolutions.length; idx++)
    {
      let diff = Math.abs(resolutions[idx]-this._quality);
      if (diff < max_diff)
      {
        max_diff = diff;
        closest_idx = idx;
      }
      let option = document.createElement("option");
      option.setAttribute("value", idx);
      option.textContent = `${resolutions[idx]}p`;
      select.appendChild(option);
    }
    select.selectedIndex = closest_idx;
    this._div.appendChild(select);
    this.quality = resolutions[closest_idx];

    select.addEventListener("change", evt => {
      const index = Number(select.options[select.selectedIndex].value);
      // Resolutions are in descending order
      let resolution = null;
      if (index >= 0)
      {
        resolution = resolutions[index];
        this.quality = resolution;
      }
      this.dispatchEvent(new CustomEvent("qualityChange", {
        detail: {quality: resolution},
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
        if (this._select != null)
        {
          if (newValue === null) {
            this._select.removeAttribute("disabled");
          } else {
            this._select.setAttribute("disabled", "");
          }
          break;
        }
    }
  }
}

customElements.define("quality-control", QualityControl);
