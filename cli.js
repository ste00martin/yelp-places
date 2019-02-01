#!/usr/bin/env node
var fs = require('fs');


const CATEGORIES = [
  // 'shopping',
  'pets',
]

const VALID_CATEGORIES = {
  'shopping': true,
  'pets': true,
  'arts': true,
  'restaurants': true,
  'food': true,
  'auto': true,
  'hotels': true,
  'financialservices': true,
  'nightlife': true,
  'active': true,
  'health': true,
  'education': true,
  'professional': true,
  'localservices': true,
  'hotelstravel': true,
  'electronics': true,
  'grocery': true,
  'deptstores': true,
  'movietheaters': true,
  'drugstores': true,
  'wholesale_stores': true,
  'coffee': true,
  'petstore': true,
}

var getYelpDataFromStations = require('./index');

const [, , ...args] = process.argv

if (args.length == 0) {
  console.error('you must provide an input csv file')
  return
}
if (args.length < 2) {
  console.error('you must provide a category')
}
const inputFileName = args[0]
if (!fs.existsSync(inputFileName)) {
  console.error('you didnt provide a valid input csv file name')
  return
}
const category = args[1]
if (!VALID_CATEGORIES[category]) {
  const urlForValidCategories ="https://www.yelp.com/developers/documentation/v3/all_category_list"
  console.error('must be a valid category. see: ', urlForValidCategories)
  return
}

const getDate = () => {
  const dateNow = new Date(Date.now())

  var year = dateNow.getFullYear()
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  var month = months[dateNow.getMonth()]
  var date = dateNow.getDate()

  const readableDate = year + '-' + month + '-' + date
  return readableDate
}

const outputFileName = 'yelp-data-' + category +'-' + getDate() + '.csv'

console.log('scanning sites', inputFileName)

getYelpDataFromStations(inputFileName, outputFileName, category)
