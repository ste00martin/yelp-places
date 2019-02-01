var Papa = require('papaparse')
var fileSystem = require('fs');
const got = require('got');
const _ = require('lodash')
const flatten = require('flat')

const INPUT_FILE = "stopshop.csv";

// const INPUT_FILE = "testdata.csv";

const YELP_LIMIT = 50 // must be less than  or equal to 50
const YELP_AUTH_TOKEN = process.env.YELP_TOKEN
const OUTPUT_CSV_FILE_NAME = 'junk-rich.csv'
const NAME = 'stop'

const CATEGORIES = [
  'grocery,deptstores,movietheaters,drugstores,wholesale_stores,coffee,petstore,electronics',
]


async function getPlaces(location, name) {
  try {
    const url = `https://api.yelp.com/v3/businesses/search?location=${location}&term=${name}&limit=${YELP_LIMIT}`

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


async function getYelpWrapper(location) {
  const yelpRequest = await getPlaces(location, NAME.toLowerCase)
  console.log('otuput', yelpRequest)
  const simplified = yelpRequest.businesses.filter(business => (business && !business.is_closed)).map(business => {
    const categories = business.categories.map(category => category.title)

    const subsetBusiness = flatten(_.omit(business, ['transactions', 'categories', 'distance']))
    return {
      ...subsetBusiness,
      'distance (meters)': business.distance,
      // categories,
      'categories': _.join(categories, '~'),
    }
  })
  return simplified
}

const saveParsedData = (neighbors) => {
  var outputCsv = Papa.unparse(neighbors, {
    header: true,
  })
  console.log('output:', outputCsv)
  fileSystem.writeFileSync(OUTPUT_CSV_FILE_NAME, outputCsv, 'utf8')
}

async function parseComplete(results) {
  let newData = []
  let data = results.data
  const totalLength = 10 //data.length

  for (i = 0; i < totalLength; i++) {
    let row = data[i]
    let address1 = row['Address']
    let zip_code = row['Zip Code']
    let state = row['State']

    let locationData = zip_code
    let location = locationData.split(" ").join("+");
    console.log('LOCATION:', location)
    let yelpData = await getYelpWrapper(location)

    yelpData.forEach(business => {
      let stationAndBusinessInfo = {
        ...business
      }
      newData.push(stationAndBusinessInfo)
      console.log('new data:', stationAndBusinessInfo)
    });

  }

  saveParsedData(newData)
}

var fileString = fileSystem.readFileSync(INPUT_FILE, 'utf8');

Papa.parse(fileString, {
  header: true,
  complete: function (results) {
    parseComplete(results)
  }
})