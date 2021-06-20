/**
 * Assumptions:
 * - All names given to types are unique
 **/
class TatorData {

  constructor(project) {
    this._project = project;

    this._mediaTypes = [];
    this._mediaTypeNames = [];
    this._localizationTypes = [];
    this._localizaitonTypeNames = [];
    this._versions = [];
    this._sections = [];
    this._algorithms = [];
    this._stateTypes = []
    this._states = {};

    this._maxFetchCount = 10000;
  }

  getMaxFetchCount() {
    return this._maxFetchCount;
  }

  getProjectId() {
    return this._project;
  }

  getStoredLocalizationTypes() {
    return this._localizationTypes;
  }

  getStoredMediaTypes() {
    return this._mediaTypes;
  }

  getStoredVersions() {
    return this._versions;
  }

  getStoredSections() {
    return this._sections;
  }

  getStoredAlgorithms() {
    return this._algorithms;
  }

  /**
   * #TODO May want to consider what it is actually necessary here to initialize with to speed up
   *       initial loading times. There typically aren't that many versions. There might be a good
   *       amount of sections.
   */
  async init() {
    await this.getAllLocalizationTypes();
    await this.getAllMediaTypes();
    await this.getAllVersions();
    await this.getAllSections();
    await this.getAllAlgorithms();
  }

  /**
   * Saves the list of localization types associated with this project
   */
  async getAllLocalizationTypes() {

    var donePromise = new Promise(resolve => {

      const localizationRestUrl = "/rest/LocalizationTypes/" + this._project;
      const localizationPromise = fetchRetry(localizationRestUrl, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
      });

      Promise.all([localizationPromise])
        .then(([localizationResponse]) => {
          const localizationJson = localizationResponse.json();
          Promise.all([localizationJson])
        .then(([localizationTypes]) => {
          this._localizationTypes = [...localizationTypes];
          resolve();
        });
      });

    });

    await donePromise;

    this._localizationTypeNames = [];
    this._localizationTypes.forEach(typeElem => this._localizationTypeNames.push(typeElem.name));
  }

  /**
   * Saves the list of media types associated with this project
   */
  async getAllMediaTypes() {

    var donePromise = new Promise(resolve => {

      const mediaRestUrl = "/rest/MediaTypes/" + this._project;
      const mediaPromise = fetchRetry(mediaRestUrl, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
      });

      Promise.all([mediaPromise])
        .then(([mediaResponse]) => {
          const mediaJson = mediaResponse.json();
          Promise.all([mediaJson])
        .then(([mediaTypes]) => {
          this._mediaTypes = [...mediaTypes];
          resolve();
        });
      });

    });

    await donePromise;

    this._mediaTypeNames = [];
    this._mediaTypes.forEach(typeElem => this._mediaTypeNames.push(typeElem.name));
  }

  /**
   * #TODO
   */
  async getAllVersions() {
    var donePromise = new Promise(resolve => {

      const versionsRestUrl = "/rest/Versions/" + this._project;
      const versionsPromise = fetchRetry(versionsRestUrl, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
      });

      Promise.all([versionsPromise])
        .then(([versionsResponse]) => {
          const versionsJson = versionsResponse.json();
          Promise.all([versionsJson])
        .then(([versions]) => {
          this._versions = [...versions];
          resolve();
        });
      });

    });

    await donePromise;
  }

  /**
   * #TODO
   */
  async getAllSections() {
    var donePromise = new Promise(resolve => {

      const sectionsRestUrl = "/rest/Sections/" + this._project;
      const sectionsPromise = fetchRetry(sectionsRestUrl, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
      });

      Promise.all([sectionsPromise])
        .then(([sectionsResponse]) => {
          const sectionsJson = sectionsResponse.json();
          Promise.all([sectionsJson])
        .then(([sections]) => {
          this._sections = [...sections];
          resolve();
        });
      });

    });

    await donePromise;
  }

  /**
   * #TODO
   */
   async getAllAlgorithms() {
    var donePromise = new Promise(resolve => {

      const restUrl = "/rest/Algorithms/" + this._project;
      const resultsPromise = fetchRetry(restUrl, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
      });

      Promise.all([resultsPromise])
        .then(([resultsPromise]) => {
          const resultsJson = resultsPromise.json();
          Promise.all([resultsJson])
        .then(([algorithms]) => {
          this._algorithms = [...algorithms];
          resolve();
        });
      });

    });

    await donePromise;
  }

  /**
   * Returns data for getFrame with project ID
   */
  async getFrame( frameId ){
    const response = await fetch(`/rest/GetFrame/${frameId}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }

  /**
   * Returns data for getLocalizationGraphic with project ID
   */
  async getLocalizationGraphic( localizationID ){
    const response = await fetch(`/rest/LocalizationGraphic/${localizationID}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "image/*",
        "Content-Type": "image/*"
      }
    });

    const data = await response.blob();

    return data;
  }

  /**
   * Gets localization object based on ID
   */
  async getLocalization(localizationId){
    const response = await fetch(`/rest/Localization/${localizationId}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();
    return data;
  }

  /**
   * Returns a data for user with user ID
   */
  async getUser( userId ){
    const response = await fetch(`/rest/User/${userId}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }


  /**
   * Returns a data for user with user ID
   */
  async getLocalizationCount({params = ""} = {}){
    const response = await fetch(`/rest/LocalizationCount/${this._project}${params}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }


  /**
    * Returns localizations list
   */
  async getLocalizations({ params = "", start = 0, stop = 20} = {}){
    const response = await fetch(`/rest/Localizations/${this._project}?start=${start}&stop=${stop}${params}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }

    /**
    * Returns localizations list
   */
  async getLocalization({ id = ""} = {}){
    const response = await fetch(`/rest/Localization/${id}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }

  /**
   * Returns a Media data
   */
  async getMedia( mediaId ){
    const response = await fetch(`/rest/Media/${mediaId}?presigned=28800`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }

  /**
   * Returns a MediaType data
   */
  async getMediaType( mediaId ){
    const response = await fetch(`/rest/MediaType/${mediaId}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }

  /**
   * @param {FilterConditionData} filter - Filter to convert
   * @returns {string} Tator REST compliant parameter string
   */
   _convertFilterForTator(filter) {

    // #TODO This will just assume we are using the user-defined attributes. Allow built-in
    //       but that will require a specific conversion table

    // Adjust the modifier to be lucene compliant
    var modifier = filter.modifier;
    var modifierEnd = "";

    if (modifier == "==") {
      modifier = "";
    }
    else if (modifier == "Includes") {
      modifier = "*";
      modifierEnd = "*";
    }

    // Lucene search string requires spaces to have the backlash preceding it
    var field = filter.field.replace(/ /g,"\\ ")
    field = field.replace(/\(/g,"\\(")
    field = field.replace(/\)/g,"\\)")
    var value = filter.value.replace(/ /g,"\\ ")
    value = value.replace(/\(/g,"\\(")
    value = value.replace(/\)/g,"\\)")

    // Finally generate the final parameter string compliant with Tator's REST call
    var paramStr = `${field}:${modifier}${value}${modifierEnd}`;
    return paramStr;
  }

  /**
   * Retrieves the data for a given entity
   * @param {integer} id
   * @param {string} entityType - media|localization
   */
  async getDataById(id, entityType) {

    let url = "/rest";

    if (entityType == "localization") {
      url += "/Localization/";
    }
    else if (entityType == "media") {
      url += "/Media/";
    }

    url += id;

    var dataPromise = (fetchRetry(url, {
      method: "GET",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
    }));

    var outData = await dataPromise.then((response) => {return response.json()});
    return outData;
  }

  /**
   * Gets data from the corresponding Tator REST endpoint
   * #TODO Currently, this will search through all of a given entity type
   *
   * @param {string} outputType -
   *  ids|objects|count
   *
   * @param {array of objects} filterData -
   *   Objects must have the following:
   *     .filters {array of FilterConditionData}
   *     .entityType {object} - media|localization
   *
   * @param {integer} dataStart -
   *   Used in conjunction with dataStop and pagination of data.
   *   If null, pagination is ignored.
   *
   * @param {integer} dataStop -
   *   Used in conjunction with dataStart and pagination of data.
   *   If null, pagination is ignored.
   *
   * @param #TODO mediaIds
   *
   * @param #TODO versionIds
   *
   * @param #TODO sectionIds
   *
   * @param {integer} dtype - Optional
   *
   * @returns {array}
   *   Results based on outputType and given filterData
   */
  async _getData(outputType, filterData, dataStart, dataStop, mediaIds, versionIds, sectionIds, dtype) {

    // #TODO In the future, this may turn into promises per meta/dtype
    var promises = [];

    var entityType;
    var mediaIds;
    var paramString = "";
    var paramSearch = "";
    for (const name in filterData) {
      entityType = filterData[name].entityType;
      for (let idx = 0; idx < filterData[name].filters.length; idx++) {
        paramSearch += encodeURIComponent(this._convertFilterForTator(filterData[name].filters[idx]));
        if (idx < filterData[name].filters.length - 1) {
          paramSearch += encodeURIComponent(" AND ");
        }
      }
    }

    if (paramSearch) {
      paramString = "&search=" + paramSearch;
    }

    if (mediaIds != undefined && mediaIds.length > 0) {
      paramString += "&media_id=";
      for (let idx = 0; idx < mediaIds.length; idx++) {
        paramString += mediaIds[idx];
        if (idx < mediaIds.length - 1) {
          paramString += ","
        }
      }
    }

    if (versionIds != undefined && versionIds.length > 0) {
      paramString += "&version=";
      for (let idx = 0; idx < versionIds.length; idx++) {
        paramString += versionIds[idx];
        if (idx < versionIds.length - 1) {
          paramString += ","
        }
      }
    }

    if (sectionIds != undefined && sectionIds.length > 0) {
      paramString += "&section=";
      for (let idx = 0; idx < sectionIds.length; idx++) {
        paramString += sectionIds[idx];
        if (idx < sectionIds.length - 1) {
          paramString += ","
        }
      }
    }

    if (dtype != undefined) {
      paramString += `&type=${dtype}`
    }

    if (paramString === "") {
      // Note: This is required for a performance boost.
      paramString += `&search=%2A`
    }

    let url = "/rest";
    let non_count_url = "/rest";

    if (this._localizationTypes.indexOf(entityType) >= 0) {
      if (outputType == "count") {
        url += "/LocalizationCount/";
        non_count_url += "/Localizations/";
      }
      else {
        url += "/Localizations/";
      }
    }
    else if (this._mediaTypes.indexOf(entityType) >= 0) {
      if (outputType == "count") {
        url += "/MediaCount/";
        non_count_url += "/Medias/";
      }
      else {
        url += "/Medias/";
      }
    }

    if (!isNaN(dataStart) && !isNaN(dataStop)) {
      // Note: & into paramString is taken care of by paramString itself
      url += `${this._project}?start=${dataStart}&stop=${dataStop}${paramString}`;

      console.log("Getting data with URL: " + url);
      promises.push(fetchRetry(url, {
          method: "GET",
          credentials: "same-origin",
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
            "Accept": "application/json",
            "Content-Type": "application/json"
          },
      }));
    }
    else {
      url += `${this._project}?`;
      non_count_url += `${this._project}?`;

      if (outputType == "count") {
        // Force paginate the counts for speed with many thousands of entries

        let thisStart = 0;
        let thisAfter = 0;
        let thisPageSize = 4500; // Error with endpoint when start + stop > 10000
        let currentCount = 0;
        let currentUrl;

        var that = this;
        async function getCount() {

          let countDone = false;
          let phase = "getEntity";

          while (!countDone) {

            if (phase == "getCount") {
              phase = "wait";

              currentUrl = url + `start=${thisStart}&stop=${thisPageSize}&after=${thisAfter}${paramString}`;
              console.log("Getting count data with URL: " + currentUrl);
              fetchRetry(currentUrl, {
                method: "GET",
                credentials: "same-origin",
                headers: {
                  "X-CSRFToken": getCookie("csrftoken"),
                  "Accept": "application/json",
                  "Content-Type": "application/json"
                },
              }).then((response) => {
                return response.json();
              }).then((data) => {
                currentCount += data;
                console.log(`count: ${data} totalCount: ${currentCount}`);
                if (data < thisPageSize || currentCount > that._maxFetchCount) {
                  countDone = true;
                }
                else {
                  phase = "getEntity";
                }
              });
            }
            else if (phase == "getEntity") {
              phase = "wait";

              if (currentCount == 0) {
                currentUrl = non_count_url + `start=0&stop=1${paramString}`;
              }
              else {
                currentUrl = non_count_url + `start=${thisPageSize - 1}&stop=${thisPageSize}&after=${thisAfter}${paramString}`;
              }
              console.log("Getting entity data with URL: " + currentUrl);
              fetchRetry(currentUrl, {
                method: "GET",
                credentials: "same-origin",
                headers: {
                  "X-CSRFToken": getCookie("csrftoken"),
                  "Accept": "application/json",
                  "Content-Type": "application/json"
                },
              }).then((response) => {
                return response.json();
              }).then((data) => {

                if (data.length > 0) {
                  thisAfter = data[0].id;
                  phase = "getCount";
                }
                else {
                  countDone = true;
                }
              });
            }
            else {
              await new Promise(resolve => {
                setTimeout(resolve, 100)
              });
            }
          }

          const blob = new Blob([JSON.stringify(currentCount, null, 2)], {type : 'application/json'});
          return new Response(blob);
        }

        var thisCountPromise = getCount();
        promises.push(thisCountPromise);
      }
      else {
        url += `${paramString}`
        console.log("Getting data with URL: " + url);
        promises.push(fetchRetry(url, {
            method: "GET",
            credentials: "same-origin",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
        }));
      }
    }
    let resultsJson = [];
    await Promise.all(promises).then((responses) => {
      for (let response of responses) {
        resultsJson.push(response.json());
      }
    });
    const outData = Promise.all(resultsJson).then((results) => {
      var flatResults = results.flat();
      if (outputType == "ids") {
        var finalResults = [];
        flatResults.forEach(data => {
          finalResults.push(data.id);
        });
      }
      else {
        finalResults = flatResults;
      }
      return finalResults;
    });

    return outData;
  }

  /**
   * Retrieves a list of localization data matching the filter criteria
   * #TODO Currently, this will search through all localization types.
   *
   * @param {string} outputType -
   *  ids|objects|count
   *
   * @param {array of FilterConditionData objects} filters -
   *    List of FilterConditionData to apply
   *    Only conditions associated with media and localizations will be applied.
   *
   * @param {integer} dataStart -
   *   Used in conjunction with dataStop and pagination of data.
   *   If null, pagination is ignored.
   *
   * @param {integer} dataStop =
   *   Used in conjunction with dataStart and pagination of data.
   *   If null, pagination is ignored.
   *
   * @returns {array of integers}
   *    List of localization IDs matching the filter criteria
   */
  async getFilteredLocalizations(outputType, filters, dataStart, dataStop) {

    // Loop through the filters, if there are any media specific ones
    var mediaFilters = [];
    var localizationFilters = [];
    var typeFilters = [];
    var versionFilters = [];
    var locGroups = {};
      this._localizationTypes.forEach(locType => {
        locGroups[locType.name] = {filters: [], entityType: locType};
      });

    if (Array.isArray(filters)) {
      filters.forEach(filter => {
        if (this._mediaTypeNames.indexOf(filter.category) >= 0) {
          mediaFilters.push(filter);
        }
        else {
          if (filter.field == "_version") {
            versionFilters.push(filter);
          }
          else if (filter.field == "_dtype") {
            typeFilters.push(filter);
          }
          else {
            localizationFilters.push(filter);
          }
        }
      });

      // First, grab the media IDs we care about if there are media filters. Otherwise, ignore.
      var mediaIds = [];
      var mediaIdChunks = [];
      if (mediaFilters.length > 0) {
        mediaIds = await this.getFilteredMedia("ids", mediaFilters);
        //console.log("matching mediaIds: " + mediaIds);

        if (mediaIds.length == 0) {
          // Found no matching media, so bail
          return [];
        }
        else {
          let idx, idx2;
          let chunkSize = 400;
          for (idx = 0, idx2 = mediaIds.length; idx < idx2; idx += chunkSize) {
            mediaIdChunks.push(mediaIds.slice(idx, idx + chunkSize));
          }
        }
      }

      var versionIds = [];
      if (versionFilters.length > 0) {
        for (let idx = 0; idx < versionFilters.length; idx++) {
          // Expected format (Name (ID:#))
          // #TODO Maybe this should be moved elsewhere to remove this dependency
          versionIds.push(Number(versionFilters[idx].value.split('(ID:')[1].replace(")","")));
        }
      }

      var dtypeIds = [];
      if (typeFilters.length > 0) {
        for (let idx = 0; idx < typeFilters.length; idx++) {
          // Expected format (type_ID)
          // #TODO Same comment as versions
          dtypeIds.push(Number(typeFilters[idx].value.split('(ID:')[1].replace(")","")));
        }
      }

      localizationFilters.forEach(filter => {
        if (this._localizationTypeNames.indexOf(filter.category) >= 0) {
          locGroups[filter.category].filters.push(filter);
        }
      });
    }

    // #TODO This process of filtering by dtype list and media id list needs to move into the
    //       endpoint itself because more data will be obtained here than needed.
    //
    //       dataStart/dataStop is used to support pagination.

    var outData = [];
    var typePromises = [];
    if (mediaIdChunks.length > 0) {

      if (isNaN(dataStart) || isNaN(dataStop)) {
        for (let chunkIdx = 0; chunkIdx < mediaIdChunks.length; chunkIdx++) {
          if (dtypeIds.length > 0) {
            dtypeIds.forEach(dtypeId => {
              typePromises.push(this._getData(outputType, locGroups, undefined, undefined, mediaIdChunks[chunkIdx], versionIds, undefined, dtypeId));
            });
          }
          else {
            typePromises.push(this._getData(outputType, locGroups, undefined, undefined, mediaIdChunks[chunkIdx], versionIds));
          }
        }
      }
      else {
        // Need to find out how many localizations there are per chunk.
        var locCountPromisesArray = [];
        for (let chunkIdx = 0; chunkIdx < mediaIdChunks.length; chunkIdx++) {
          if (dtypeIds.length > 0) {
            dtypeIds.forEach(dtypeId => {
              locCountPromisesArray.push(this._getData("count", locGroups, undefined, undefined, mediaIdChunks[chunkIdx], versionIds, undefined, dtypeId));
            });
          }
          else {
            locCountPromisesArray.push(this._getData("count", locGroups, undefined, undefined, mediaIdChunks[chunkIdx], versionIds));
          }
        }
        var locCountResults = await Promise.all(locCountPromisesArray);

        // Finally, get the correct set of data now that we know all of the counts.
        var currentStart = 0;
        var currentSize;
        var currentStop;
        var locCountResultsIdx = 0;

        for (let chunkIdx = 0; chunkIdx < mediaIdChunks.length; chunkIdx++) {
          if (dtypeIds.length > 0) {
            dtypeIds.forEach(dtypeId => {
              currentSize = Number(locCountResults[locCountResultsIdx]);
              currentStop = currentStart + currentSize;
              locCountResultsIdx += 1;

              if (dataStop < currentStop || ((dataStart < currentStop) && (dataStop - currentStart >= 0))) {
                let chunkPageStart = dataStart - currentStart;
                let chunkPageStop = dataStop - currentStart;
                if (chunkPageStart < 0) {chunkPageStart = 0;}
                if (chunkPageStop > 0) {
                  typePromises.push(this._getData(outputType, locGroups, chunkPageStart, chunkPageStop, mediaIdChunks[chunkIdx], versionIds, undefined, dtypeId));
                }
              }

              currentStart = currentStop;
            });
          }
          else {
            currentSize = Number(locCountResults[locCountResultsIdx]);
            currentStop = currentStart + currentSize;
            locCountResultsIdx += 1;

            if (dataStop < currentStop || ((dataStart < currentStop) && (dataStop - currentStart >= 0))) {
              let chunkPageStart = dataStart - currentStart;
              let chunkPageStop = dataStop - currentStart;
              if (chunkPageStart < 0) {chunkPageStart = 0;}
              if (chunkPageStop > 0) {
                typePromises.push(this._getData(outputType, locGroups, chunkPageStart, chunkPageStop, mediaIdChunks[chunkIdx], versionIds));
              }
            }
            else if (isNaN(dataStart) && isNaN(dataStop)) {
              typePromises.push(this._getData(outputType, locGroups, undefined, undefined, [], versionIds, undefined, dtypeId));
            }

            currentStart = currentStop;
          }
        }
      }
    }
    else {

      var locCountPromisesArray = [];
      if (dtypeIds.length > 0) {
        dtypeIds.forEach(dtypeId => {
          locCountPromisesArray.push(this._getData("count", locGroups, undefined, undefined, [], versionIds, undefined, dtypeId));
        });
      }
      else {
        locCountPromisesArray.push(this._getData("count", locGroups, undefined, undefined, [], versionIds));
      }
      var locCountResults = await Promise.all(locCountPromisesArray);

      if (dtypeIds.length > 0) {

        var currentStart = 0;
        var currentSize;
        var currentStop;
        var locCountResultsIdx = 0;
        dtypeIds.forEach(dtypeId => {
          currentSize = Number(locCountResults[locCountResultsIdx]);
          currentStop = currentStart + currentSize;
          locCountResultsIdx += 1;

          if (dataStop < currentStop || ((dataStart < currentStop) && (dataStop - currentStart >= 0))) {
            let chunkPageStart = dataStart - currentStart;
            let chunkPageStop = dataStop - currentStart;
            if (chunkPageStart < 0) {chunkPageStart = 0;}
            if (chunkPageStop > 0) {
              typePromises.push(this._getData(outputType, locGroups, chunkPageStart, chunkPageStop, [], versionIds, undefined, dtypeId));
            }
          }
          else if (isNaN(dataStart) && isNaN(dataStop)) {
            typePromises.push(this._getData(outputType, locGroups, undefined, undefined, [], versionIds, undefined, dtypeId));
          }

          currentStart = currentStop;
        });
      }
      else {
        typePromises.push(this._getData(outputType, locGroups, dataStart, dataStop, [], versionIds));
      }
    }

    var typeResults = await Promise.all(typePromises);
    var outData;
    if (outputType == "count") {
      outData = 0;
    }
    else {
      outData = [];
    }

    for (let idx = 0; idx < typeResults.length; idx++) {
      if (outputType == "count") {
        outData += Number(typeResults[idx]);
      }
      else {
        outData.push(...typeResults[idx]);
      }
    }
    return outData;
  }

  /**
   * Retrieves a list of media data based on the given filters.
   * #TODO Currently, this will search through all media types.
   *
   * @param {string} outputType -
   *  ids|objects|count
   *
   * @param {array of FilterConditionData} filters -
   *   List of FilterConditionData to apply
   *   Only conditions associated with media will be applied
   *   If there are no filters, this will just return
   *
   * @param {integer} dataStart -
   *   Used in conjunction with dataStop and pagination of data.
   *   If null, pagination is ignored.
   *
   * @param {integer} dataStop =
   *   Used in conjunction with dataStart and pagination of data.
   *   If null, pagination is ignored.
   *
   * @returns {array of integers} List of media IDs matching the filter criteria
   */
  async getFilteredMedia(outputType, filters, dataStart, dataStop) {

    let mediaGroups = {};
    var sectionFilters = [];

    this._mediaTypes.forEach(mediaType => {
      mediaGroups[mediaType.name] = {entityType: mediaType, filters: []};
    });

    if (filters != undefined) {
      filters.forEach(filter => {
        if (this._mediaTypeNames.indexOf(filter.category) >= 0) {
          if (filter.field == "_section") {
            sectionFilters.push(filter);
          }
          else {
            mediaGroups[filter.category].filters.push(filter);
          }
        }
      });
    }

    var sectionIds = [];
    if (sectionFilters.length > 0) {
      for (let idx = 0; idx < sectionFilters.length; idx++) {
          // Expected format (Name (ID:#))
          // #TODO Maybe this should be moved elsewhere to remove this dependency
          sectionIds.push(Number(sectionFilters[idx].value.split('(ID:')[1].replace(")","")));
      }
    }

    var outData = await this._getData(outputType, mediaGroups, dataStart, dataStop, null, null, sectionIds);
    return outData;
  }

  /**
   * Launches the given algorithm with the provided parameters
   * @param {string} algorithmName - Name of registered algorithm to launch
   * @param {array} parameters - Array of {name:..., value:...} objects
   *
   * #TODO Add media_query and media_ids parameters
   */
  async launchAlgorithm(algorithmName, parameters) {

    // #TODO Launching an algorithm requires sending at least one valid media ID.
    //       Let's just query and grab the first one.
    var mediaIds = await this.getFilteredMedia("ids", null, 0, 1);

    let body = {
      "algorithm_name": algorithmName,
      "extra_params": parameters,
      "media_ids": mediaIds
    }

    var launched = false;
    await fetchRetry("/rest/AlgorithmLaunch/" + this._project, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
    })
    .then(response => {
      if (response.status == 201) {
        launched = true;
      }
    });

    return launched;
  }

  /**
   * Creates a Tator link to the given media and provided parameters
   * Assumes the media is in the same project as this tator data module.
   * @param {integer} mediaId
   * @param {integer} frame - optional
   * @param {integer} entityId - optional
   * @param {integer} typeId - optional, will convert to Tator annotator friendly link
   * @param {integer} version - optional
   * @returns {str} Tator link using given parameters
   */
  generateMediaLink(mediaId, frame, entityId, typeId, version) {
    var outStr = `/${this._project}/annotation/${mediaId}?`;
    var addedParam = false;

    if (frame) {
      if (addedParam) {
        outStr += "&"
      }
      outStr += `frame=${frame}`;
      addedParam = true;
    }

    if (entityId) {
      if (addedParam) {
        outStr += "&"
      }
      outStr += `selected_entity=${entityId}`;
      addedParam = true;
    }

    if (typeId) {
      if (addedParam) {
        outStr += "&"
      }

      let annotatorTypeId;
      for (let type of this._localizationTypes) {
        if (type.id == typeId) {
          annotatorTypeId = type.dtype;
          break;
        }
      }
      annotatorTypeId += `_${typeId}`

      outStr += `selected_type=${annotatorTypeId}`;
      addedParam = true;
    }

    if (version) {
      if (addedParam) {
        outStr += "&"
      }
      outStr += `version=${version}`;
      addedParam = true;
    }

    return outStr;
  }

  /**
   * Collections 
   * @param {acceptedAssoc} {array} of association types to INCLUDE
   * @param {pageSize} {array} of association types to INCLUDE
   * - Returns states and total information to be processed
  */
  async collectionsInit({ acceptedAssoc, pageSize = 5 }) {
    this._stateTypes = await this.getStateTypes();
    this._states.total = 0;
    this.stateTypeData = {};
    let searchParam = "";

    this._states.paginationState = {
      pageSize,
      page: 1,
      start: 0,
      stop: pageSize,
      init: true
    };

    const typeIds = this._stateTypes.filter(type => acceptedAssoc.includes(type.association)).map(type => {
      this.stateTypeData[type.id] = type;
      return type.id;
    });

    //console.log(typeIds);
    if(typeIds && typeIds.length > 1){
      let esQuery = `_meta:(${typeIds.join(" OR ")})`;
      searchParam = `?search=${encodeURIComponent(esQuery)}`
    } else if(typeIds && typeIds.length == 1) {
      searchParam = `?type=${typeIds[0]}`;
    }

    // If we have type ids, and search meta created
    if (searchParam !== "") {
      // save this if we need to paginate this state list
      this._states.searchParam = searchParam;

      // Get state count #todo- "search" not working so adding by type
      for(let t of typeIds){
        let typeTotal = await this.getStateCount({
          params: `?type=${t}`
        });
        this.stateTypeData[t].total = typeTotal
        this._states.total += typeTotal;
      }

      // get relevant states
      this._states.states = await this.getStates({
        params: this._states.searchParam,
        dataStart: this._states.paginationState.start,
        dataStop: this._states.paginationState.stop
      });

      // add accessible type data to the state
      this._states.states.map(state => {
        // pass along some data we already fetch about the association, and state name to view with the state
        state.typeData = this.stateTypeData[state.meta];
        return state;
      });
    }

    return this._states;
  }

  async _paginateStatesFetch() {
    // get relevant states
    let newStates = await this.getStates({
      params: this._states.searchParam,
      dataStart: this._states.paginationState.start,
      dataStop: this._states.paginationState.stop
    });

    // add accessible type data to the state
    newStates.map(state => {
      // pass along some data we already fetch about the association, and state name to view with the state
      state.typeData = this.stateTypeData[state.meta];
      return state;
    });

    this._states.states = [...this._states.states, ...newStates];

    return newStates;
  }

  /**
   * Retrieves state types
   */
  async getStateTypes({ params = "?", dataStart = 0, dataStop = 1000 } = {}) {
    const response = await fetch(`/rest/StateTypes/${this._project}${params}&start=${dataStart}&stop=${dataStop}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }

  /**
   * Retrieves state count
   * @param {params} optional list of query parameter should start with "?"
   */
  async getStateCount({ params = "" } = {}) {
    const response = await fetch(`/rest/StateCount/${this._project}${params}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }

  /**
   * Retrieves states (start and stop)
   * @param {params}
   * @param {dataStart}
   * @param {dataStop}
   * #todo - better checking about when to add params/ etc. working around endpoint bug sending start and stop for now
   */
  async getStates({ params = "?", dataStart = 0, dataStop = 25 } = {}) {
    const response = await fetch(`/rest/States/${this._project}${params}&start=${dataStart}&stop=${dataStop}`, {
      method: "GET",
      mode: "cors",
      credentials: "include",
      headers: {
        "X-CSRFToken": getCookie("csrftoken"),
        "Accept": "application/json",
        "Content-Type": "application/json"
      }
    });
    const data = await response.json();

    return data;
  }

}



