import { compareJSON } from "../../utils";

export default {
  async beforeCreate(event) {
    console.log('client.beforeCreate')
    const address = event.params.data.address

    const geocode = await strapi.service("api::client.client").getLatitudeLongitude(address);

    event.params.data.address.latitude = geocode.latitude
    event.params.data.address.longitude = geocode.longitude
  },
  async beforeUpdate(event) {
    console.log('client.beforeUpdate')
    const clientId = event.params.data.id || event.params.where.id
    const addressReceived = event.params.data.address

    const clientCurrent = await strapi.entityService.findOne("api::client.client", clientId);
    event.state.address = clientCurrent.address

    if (!compareJSON(addressReceived, clientCurrent.address)) {
      const addressReceivedGeocode = await strapi
        .service("api::client.client")
        .getLatitudeLongitude(addressReceived);

      event.params.data.address.latitude = addressReceivedGeocode.latitude
      event.params.data.address.longitude = addressReceivedGeocode.longitude
    }
  },
  async afterUpdate(event) {
    console.log('client.afterUpdate')
    const clientId = event.params.data.id || event.params.where.id
    const addressOld = event.state.address
    const addressCurrent = event.params.data.address

    if (!compareJSON(addressOld, addressCurrent)) {
      console.log('need update address')

      await strapi.service("api::client.client").handleUpdateClient(clientId);
    }
  },
  async beforeDelete(event) {
    const clientId = event.params.where.id

    const routes = await strapi.entityService.findMany("api::route.route", {
      filters: {
        clients: {
          id: clientId,
        },
      }
    });

    for (const route of routes) {
      await strapi.entityService.update("api::route.route", route.id, {
        data: {
          clients: {
            disconnect: clientId
          }
        },
      });
    }
  }
};


