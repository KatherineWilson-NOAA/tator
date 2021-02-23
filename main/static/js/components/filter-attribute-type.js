/**
 * Element used to encapsulate a single entity type for the data filtering module
 *
 * This responds to the given attribute information provided.
 */
class FilterAttributeType extends TatorElement {

  constructor() {
    super();

    this._div = document.createElement("div");
    this._shadow.appendChild(this._div);

    this._attributeTypeLabel = document.createElement("span");
    this._attributeTypeLabel.setAttribute("class", "h3");
    this._div.appendChild(this._attributeTypeLabel);

    this._attributes = [];
  }

  /**
   * Sets the available filter parameters
   *
   * @param {object} val - Object with the following fields:
   *    .name - str - Name of attribute type
   *    .attributes - array - Array of objects with the following fields:
   *        .name - str - Name of attribute
   *        .dtype - str - string|bool|float|int|datetime|geopos|enum
   *        .choices - array - Valid only if enum was provided
   */
  set data(val) {
    this._data = val;
    this.setTypeParameters(this._data.name, this._data.attributes);
  }

  /**
   *
   * @param {string} entityTypeLabel - Name of the entity type
   * @param {array} attributes - List of objects with .name .dtype
   */
  setTypeParameters(entityTypeLabel, attributes)
  {
    this._attributes = attributes;
    this._attributeTypeLabel.textContent = entityTypeLabel;
  }

  /**
   * Creates a new UI row for the user to create a filter set with
   */
  createNewFilter()
  {
    var filterElem = document.createElement("filter-attribute-field");
    filterElem.data = this._data.attributes;
  }

  /**
   * Clears the current list of filters
   */
  clearFilters()
  {
  }

  /**
   * Removes the given filter field
   * @param {*} elem
   */
  removeFilter(elem)
  {
  }

  /**
   * Minimizes the UI portion
   */
  minimize()
  {
  }
}

customElements.define("filter-attribute-type", FilterAttributeType);