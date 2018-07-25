var Papa = require('papaparse')
var fileSystem = require('fs');
const got = require('got');
const _ = require('lodash')

var txtFile = "activeclusters.csv";
var fileString = fileSystem.readFileSync(txtFile,'utf8');

const YELP_LIMIT = 2 // must be less than  or equal to 50
const YELP_RADIUS = 1000 // must be less than or equal to 4000
const YELP_AUTH_TOKEN = process.env.YELP_TOKEN
const OUTPUT_CSV_FILE_NAME = 'output2.csv'

async function getPlaces (latitude, longitude) {
    try {
        const url = `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&limit=${YELP_LIMIT}&radius=${YELP_RADIUS}&sort_by=distance`
        const options = {
          headers: {
            Authorization: `Bearer ${YELP_AUTH_TOKEN}`
          }
        }
        const response = await got(url, options);

        return JSON.parse(response.body)
    } catch (error) {
      return error
    }
}


async function getYelpWrapper(latitude, longitude) {
  const yelpRequest = await getPlaces(latitude,longitude)
  const simplified = yelpRequest.businesses.filter(business => !business.is_closed).map(business => {
    let newBusinessData = _.pick(business, ['distance', 'name', 'alias', 'categories', 'price'])

    newBusinessData.categories = newBusinessData.categories.map(category => category.title)
    return {
      'business name': newBusinessData.name,
      'business distance meters': newBusinessData.distance,
      'business categories': _.join(newBusinessData.categories, '~'),
      'business price': newBusinessData.price,
    }
  })
  return simplified
}

const saveParsedData = (neighbors) => {
  var outputCsv = Papa.unparse(neighbors,{
    header: true,
  })

  fileSystem.writeFileSync(OUTPUT_CSV_FILE_NAME, outputCsv, 'utf8')
}

async function parseComplete (results) {
  let newData = []
  let data = results.data
  for (i = 0; i < data.length; i++) {
    let row = data[i]
    var latitude = row.Latitude
    var longitude = row.Longitude
    let yelpData = await getYelpWrapper(latitude,longitude)
    yelpData.forEach(business => {
      let stationAndBusinessInfo =  {...row, ...business}
      newData.push(stationAndBusinessInfo)
      console.log('new data:' , stationAndBusinessInfo)
    });
  }
  saveParsedData(newData)
}

Papa.parse(fileString, {
  header: true,
  complete: function(results) {
    parseComplete(results)
  }
})