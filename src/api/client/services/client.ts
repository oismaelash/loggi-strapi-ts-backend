import { factories } from "@strapi/strapi";
import axios from "axios";

export default factories.createCoreService("api::client.client", () => ({
  async getLatitudeLongitude(addressJson, addressFull) {
    try {
      const fullAddress = addressFull ||
        `${addressJson.street}, ${addressJson.number}, ${addressJson.city}, ${addressJson.state}`;
      const urlGoogleMaps = `${process.env.GOOGLE_API_URL}${fullAddress}&key=${process.env.GOOGLE_API_TOKEN}`;
      const response = await (await axios.get(urlGoogleMaps)).data;

      if (response.status === "ZERO_RESULTS") {
        throw new Error("GOOGLE API, ZERO_RESULTS");
      }

      const latitude = response.results[0].geometry.location.lat;
      const longitude = response.results[0].geometry.location.lng;

      return { latitude, longitude }
    } catch (error) {
      console.log(error);
    }
  },
  async handleUpdateClient(clientId) {
    const routes = await strapi.entityService.findMany("api::route.route", {
      filters: {
        clients: {
          id: clientId,
        },
      }
    });

    for (const route of routes) {
      await strapi.service("api::route.route").handleUpdateRoute(route.id, route.startingAddress);
    }
  }
}));
