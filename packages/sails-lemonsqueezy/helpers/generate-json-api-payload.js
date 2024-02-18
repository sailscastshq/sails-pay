/**
 * Generates a JSON:API payload for making requests.
 * @param {string} type - The type of the resource.
 * @param {Object} data - The attributes of the resource.
 * @param {Object} [relationships={}] - The relationships of the resource.
 * @returns {string} - A JSON string representing the JSON:API request body.
 */
module.exports = function generateJsonApiPayload(
  type,
  data,
  relationships = {}
) {
  const payload = {
    data: {
      type: type,
      attributes: data,
      relationships: relationships
    }
  }
  return JSON.stringify(payload)
}
