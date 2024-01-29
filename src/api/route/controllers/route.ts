/**
 * route controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::route.route', () => ({
  async getClientsByRouteId(ctx) {
    const { id } = ctx.params

    const route = await strapi.entityService.findOne('api::route.route', id, { populate: { clients: true } })

    ctx.send(route)
  },
  async optimized(ctx) {
    const BODY = ctx.request.body

    const orderCoordinates = await strapi
      .service("api::route.route")
      .orderRoute(BODY.waypoints, BODY.startpoint);

    const startingAddress = `${BODY.startpoint.lat},${BODY.startpoint.lng}`

    const link = await strapi
      .service("api::route.route")
      .buildGoogleMapsURL(startingAddress, orderCoordinates);

    const response = {
      url: link,
      waypoints: [BODY.startpoint, ...orderCoordinates]
    }

    ctx.send(response)
  }
}));
