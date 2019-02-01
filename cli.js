#!/usr/bin/env node
var fs = require('fs');


var getYelpDataFromStations = require('./index');

const [, , ...args] = process.argv

if (args.length == 0) {
  console.error('you must provide an input csv file')
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

const outputFileName = 'yelp-data-' + getDate() + '.csv'

const inputFileName = args[0]

const category = args[1]

if (fs.existsSync(inputFileName)) {
  console.log('hello world', inputFileName)

  getYelpDataFromStations(inputFileName, outputFileName)
  console.log('all done')

  // Do something
}



