import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
const app = express();
const port = 3000;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
const __dirname = dirname(fileURLToPath(import.meta.url));
//data is for user location include name , city , state , country , latitude , longitude
const data = read(__dirname + "/data/location.json");
//weatherIcon is for the retrieve icons and description on the bases of weather code and day code
const weatherIcons = read(__dirname + "/data/weatherIcons.json");
try {
} catch (error) {
  console.log(error.message);
}
app.get("/", async (req, res) => {
  await fetchAndRenderWeather(req, res, "today.ejs");
});
app.get("/find", (req, res) => {
  res.render("find.ejs");
});
// this block is for search the location
app.post("/search", async (req, res) => {
  try {
    const searchCity = req.body["citySearch"];
    const response = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${searchCity}&count=10&language=en&format=json`
    );
    const result = response.data.results;
    res.render("find.ejs", { searchResult: result });
  } catch (error) {
    console.log(error.response.data);
  }
  res.render("find.ejs");
});
// this block save the selected location to the location.json file as a object
app.post("/submitLocation", async (req, res) => {
  try {
    const infoObject = {
      name: req.body["name"],
      city: req.body["city"],
      state: req.body["state"],
      country: req.body["country"],
      latitude: req.body["latitude"],
      longitude: req.body["longitude"],
      timezone: req.body["timezone"],
    };
    fs.writeFileSync(
      __dirname + "/data/location.json",
      JSON.stringify(infoObject)
    );
    res.render("find.ejs", { message: "Location has been added" });
  } catch (error) {
    console.log(error);
  }
  res.render("find.ejs");
});

app.get("/today", async (req, res) => {
  await fetchAndRenderWeather(req, res, "today.ejs");
});
app.get("/hourly", async (req, res) => {
  //same as part-1
  await fetchAndRenderWeather(req, res, "hour.ejs");

});
app.get("/monthly", async(req, res) => {
  await fetchAndRenderWeather(req, res, "month.ejs");
});


app.listen(port, () => {
  console.log(`server is running on http://localhost:${port}`);
});
function write(array, path) {}
function read(path) {
  const fileContent = fs.readFileSync(path);
  const array = JSON.parse(fileContent);
  return array;
}

function icons(weather_code, day_code, object) {
  var is_day;
  var w_code = weather_code.toString();
  if (day_code == 1) {
    is_day = "day";
  } else {
    is_day = "night";
  }
  return object[w_code][is_day];
}
// this function is used to retrieve all variables and call anywhere 
async function fetchAndRenderWeather(req, res, viewTemplate) {
  try {
      const response = await axios.get(
          `https://api.open-meteo.com/v1/forecast?latitude=${data.latitude}&longitude=${data.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,showers,snowfall,snow_depth,weather_code,pressure_msl,surface_pressure,cloud_cover,cloud_cover_low,cloud_cover_mid,cloud_cover_high,visibility,evapotranspiration,et0_fao_evapotranspiration,vapour_pressure_deficit,wind_speed_10m,wind_speed_80m,wind_speed_120m,wind_speed_180m,wind_direction_10m,wind_direction_80m,wind_direction_120m,wind_direction_180m,wind_gusts_10m,temperature_80m,temperature_120m,temperature_180m,soil_temperature_0cm,soil_temperature_6cm,soil_temperature_18cm,soil_temperature_54cm,soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm,soil_moisture_9_to_27cm,soil_moisture_27_to_81cm&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,uv_index_clear_sky_max,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,shortwave_radiation_sum,et0_fao_evapotranspiration&timezone=auto&forecast_days=16`
      );

      const result = response.data;
      const is_day = result.current["is_day"] == 1 ? "day" : "night";
      const weather_info = icons(
          result.current["weather_code"],
          result.current["is_day"],
          weatherIcons
      );

      // Render the specified view template with the data
      res.render(viewTemplate, {
          name: data.name,
          city: data.city,
          state: data.state,
          country: data.country,
          currentData: result,
          description: weather_info.description,
          iconURL: weather_info.image,
          is_day: is_day,
          weatherInfo: weatherIcons,
      });
  } catch (error) {
      console.error("Error fetching weather data:", error);
  }
}