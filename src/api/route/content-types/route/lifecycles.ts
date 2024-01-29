import { getRouteData } from "../../utils/address";

export default {
  async beforeCreate(event) {
    const routeData = await strapi
      .service("api::route.route")
      .handleCreateRoute(event);

    console.log(routeData);
    console.log(event.params.data.clients);
    event.params.data.clients = routeData.orderCoordinates;
    event.params.data.link = routeData.link;
  },
  async afterUpdate(event) {
    console.log("route.afterUpdate");
    const routeId = event.params.data.id || event.params.where.id;

    const routeData = await strapi.entityService.findOne(
      "api::route.route",
      routeId
    );
    const startingAddress =
      event.params.data.startingAddress || routeData.startingAddress;

    const { orderCoordinatesData, orderCoordinates } = await getRouteData(routeId, startingAddress, 'route')

    const link: string = await strapi
      .service("api::route.route")
      .buildGoogleMapsURL(startingAddress, orderCoordinatesData);

    if (routeData.link != link) {
      const routeDataUpdated = {
        orderCoordinates,
        link,
      };

      await strapi
        .service("api::route.route")
        .handleUpdateRoute(routeId, undefined, routeDataUpdated);
    }
  },
};
