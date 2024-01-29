import { factories } from "@strapi/strapi";
import { getRouteData } from "../utils/address";

export default factories.createCoreService("api::route.route", () => ({
  async getCoordinatesByClients(clientIds) {
    let coordinates = [];

    for (const client of clientIds) {
      const clientId = client.id || client;
      const data = await strapi.entityService.findOne(
        "api::client.client",
        clientId
      );

      const address = JSON.parse(JSON.stringify(data.address));
      const fullAddress = `${address.street}, ${address.number}, ${address.city}, ${address.state}`;

      coordinates.push({
        id: data.id,
        lat: address.latitude,
        lng: address.longitude,
        address: fullAddress
      });
    }

    return coordinates;
  },
  async getCoordinatesByRouteId(routeId) {
    const clients = await strapi.entityService.findMany("api::client.client", {
      filters: {
        routes: {
          id: routeId,
        },
      },
    });

    let coordinates = [];

    for (const client of clients) {
      const address = JSON.parse(JSON.stringify(client.address));
      const fullAddress = `${address.street}, ${address.number}, ${address.city}, ${address.state}`;

      coordinates.push({
        id: client.id,
        lat: address.latitude,
        lng: address.longitude,
        address: fullAddress
      });
    }

    return coordinates;
  },
  async orderRoute(coordinates, startingAddress) {
    function calculateDistance(lat1, lng1, lat2, lng2) {
      const earthRadius = 6371;
      const dLat = degreesToRadians(lat2 - lat1);
      const dlng = degreesToRadians(lng2 - lng1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(degreesToRadians(lat1)) *
        Math.cos(degreesToRadians(lat2)) *
        Math.sin(dlng / 2) *
        Math.sin(dlng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return earthRadius * c * 1000;
    }

    function degreesToRadians(degrees) {
      return degrees * (Math.PI / 180);
    }

    function sortCoordinates(coordinates, startingAddress) {
      return coordinates.sort((a, b) => {
        const distA = calculateDistance(
          startingAddress.lat,
          startingAddress.lng,
          a.lat,
          a.lng
        );
        const distB = calculateDistance(
          startingAddress.lat,
          startingAddress.lng,
          b.lat,
          b.lng
        );
        return distA - distB;
      });
    }

    return sortCoordinates(coordinates, startingAddress);
  },
  async buildGoogleMapsURL(startingAddress, coordinates) {
    if (coordinates.length === 0) {
      throw new Error("Coordinates array is empty.");
    }

    const encodedStartAddress = encodeURIComponent(startingAddress);

    const destination = coordinates[coordinates.length - 1];
    const destinationParam = `${destination.lat},${destination.lng}`;

    let waypointsParam = "";

    for (let i = 0; i < coordinates.length - 1; i++) {
      waypointsParam += coordinates[i].address ?
        `${coordinates[i].address}|` :
        `${coordinates[i].lat},${coordinates[i].lng}|`;
    }

    waypointsParam = waypointsParam.slice(0, -1);

    const url = `https://www.google.com/maps/dir/?api=1&origin=${encodedStartAddress}&destination=${destinationParam}&travelmode=driving&waypoints=${waypointsParam}`;

    return url;
  },
  async handleCreateRoute(event) {
    const clients = event.params.data.clients.connect || event.params.data.clients;
    const startingAddress = event.params.data.startingAddress;

    const { coordinates, orderCoordinates } = await getRouteData(clients, startingAddress, 'client')

    const link = await this.buildGoogleMapsURL(startingAddress, coordinates);

    return { link, orderCoordinates };
  },
  async handleUpdateRoute(routeId, startingAddress, routeDataUpdated) {
    if (routeDataUpdated) {
      await strapi.entityService.update("api::route.route", routeId, {
        data: {
          clients: {
            set: routeDataUpdated.orderCoordinates,
          },
          link: routeDataUpdated.link,
        },
      });
    } else {
      const { coordinates, orderCoordinates } = await getRouteData(routeId, startingAddress, 'route')

      const link: string = await this.buildGoogleMapsURL(
        startingAddress,
        coordinates
      );

      await strapi.entityService.update("api::route.route", routeId, {
        data: {
          clients: {
            set: orderCoordinates,
          },
          link,
        },
      });
    }
  },
}));
