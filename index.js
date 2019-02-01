var Papa = require('papaparse')
var fileSystem = require('fs');
const got = require('got');
const _ = require('lodash')
const flatten = require('flat')


// const INPUT_FILE = "testdata.csv";

const YELP_LIMIT = 50 // must be less than  or equal to 50
const YELP_RADIUS = 40000 // must be less than or equal to 40000
const YELP_AUTH_TOKEN = process.env.YELP_TOKEN

// https://www.yelp.com/developers/documentation/v3/all_category_list

const CATEGORIES = [
  'shopping',
  // 'pets',
]

const categories2 = [
  'arts',
  'restaurants',
  'food',
  'auto',
  'hotels',
  'financialservices',
  'nightlife',
  'active',
  'health',
  'education',
  'professional',
  'localservices',
  'hotelstravel',
  'electronics',
  'grocery',
  'deptstores',
  'movietheaters',
  'drugstores',
  'wholesale_stores',
  'coffee',
  'petstore',
]

async function getPlaces(latitude, longitude, category) {
  try {
    const url = `https://api.yelp.com/v3/businesses/search?latitude=${latitude}&longitude=${longitude}&limit=${YELP_LIMIT}&radius=${YELP_RADIUS}&sort_by=distance`
    console.log('category is', category)
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


async function getYelpWrapper(latitude, longitude, filterCategory) {
  try {
    console.log('filterCategory is', filterCategory)
    const yelpRequest = await getPlaces(latitude,longitude, filterCategory)

    const simplified = yelpRequest.businesses.filter(business => ( business && !business.is_closed)).map(business => {
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
  } catch (error) {
    console.log('ERROR IN WRAPPER', error)
    return []
  }
}

const saveParsedData = (neighbors, outputFileName) => {
  var outputCsv = Papa.unparse(neighbors, {
    header: true,
  })
  console.log('output:', outputCsv)
  fileSystem.writeFileSync(outputFileName, outputCsv, 'utf8')
}

async function parseComplete(results, outputFileName) {
  let newData = []
  let data = results.data

  for (j = 0; j < CATEGORIES.length; j++){
    for (i = 0; i < data.length; i++) {
      let row = data[i]
      let stationLatitude = row['Latitude']
      let stationLongitude = row['Longitude']
      let stationLIN = row.LIN
      let siteAccountName = row['Location (LIN): Location Name']

      if (stationLatitude && stationLongitude) {
        console.log('CATEGORIES IS ', CATEGORIES[j])
        let yelpData = await getYelpWrapper(stationLatitude, stationLongitude, CATEGORIES[j])

        stationAndBusinessInfo = yelpData.map(business => {
          return {
            stationLatitude,
            stationLongitude,
            stationLIN,
            siteAccountName,
            ...business
          }
        })
        newData = newData.concat(stationAndBusinessInfo)
        console.log('new data number of records:', stationAndBusinessInfo.length, stationAndBusinessInfo[0])
      }
    }
  }

  // fileSystem.writeFile('./data.json', JSON.stringify(newData, null, 2) , 'utf-8');

  saveParsedData(newData, outputFileName)
}


const getYelpDataFromStations = (inputFileName, outputFileName) => {
  // const INPUT_FILE = "report-11-26-18.csv";
  // const OUTPUT_CSV_FILE_NAME = 'yelp-cinema-11-26-18.csv'

  var fileString = fileSystem.readFileSync(inputFileName, 'utf8');

  Papa.parse(fileString, {
    header: true,
    complete: function (results) {
      parseComplete(results, outputFileName)
    }
  })



}

module.exports = getYelpDataFromStations