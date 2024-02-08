//This file is used to generate data by running locaklly

const fs = require('fs');
let dataContriesWithCities = require('./ContriesWithCities.json');
let dataCountries = require('./Countries.json');
let dataCountryAndCapital = require('./CountryAndCapital.json');
const dotenv = require('dotenv');


// function jsonReader(filePath, cb) {
//     fs.readFile(filePath, (err, fileData) => {
//         if (err) {
//             console.log("error fetching file", err);
//             return cb && cb(err);
//         }
//         try {
//             const object = JSON.parse(fileData);
//             return cb && cb(null, object);
//         } catch (err) {
//             return cb && cb(err);
//         }
//     });
// }
// const finalData = Object.keys(dataCountries) ;
// const jsonString = JSON.stringify(finalData);
// try {
//     fs.writeFileSync('./Countries.json', jsonString);
//     console.log("File Created");
// } catch (e) {
//     console.error(e);
// }
const removeDuplicateCities = () => {
   const finalData = Object.keys(dataContriesWithCities);
   let dataContriesCopy = finalData.map((country) => {
      let cities = dataContriesWithCities[country];
      const uniqueCities = new Set(cities);
      let newData = [...uniqueCities];
      // console.log(newData);
      return { [country]: newData };
   });
   console.log(dataContriesCopy);
   const jsonString = JSON.stringify(dataContriesCopy);
   fs.writeFileSync('./copyData.json', jsonString)
}
const fillCapitalCity = () => {
   let newDataCountries = dataCountries.map((countryMain) => {

      let captialCityFound = dataCountryAndCapital.filter((country) => {
         if (country.Country === countryMain.Country) {
            return country;
         }
      });
      if (captialCityFound.length > 0) {
         countryMain.CapitalCity = captialCityFound[0].CapitalCity;
         console.log(countryMain);
      }
      return countryMain;
   });
   const jsonString = JSON.stringify(newDataCountries);
   fs.writeFileSync('./copyData1.json', jsonString)
}
const fillFlag = ()=>{
   let newDataCountries = dataCountries.map((country) => {
         country.flag = `https://flagcdn.com/h240/${country.CountryCode2.toLocaleLowerCase()}.png`
      return country;
   });
   const jsonString = JSON.stringify(newDataCountries);
   fs.writeFileSync('./copyData1.json', jsonString)
}
fillFlag();
//fillCapitalCity();
//removeDuplicateCities();