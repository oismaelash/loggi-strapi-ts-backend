type OrderType = 'route' | 'client'

export async function getRouteData(ids, startingAddress, orderType: OrderType,) {
  let coordinates = undefined

  switch (orderType) {
    case "route":
      coordinates = await strapi.service("api::route.route").getCoordinatesByRouteId(ids);
      break
    case "client":
      coordinates = await strapi.service("api::route.route").getCoordinatesByClients(ids);
      break
  }

  const startAddressGeocode = await strapi
    .service("api::client.client")
    .getLatitudeLongitude(undefined, startingAddress);

  const orderCoordinatesData = await strapi
    .service("api::route.route")
    .orderRoute(coordinates, {
      lat: startAddressGeocode.latitude,
      lng: startAddressGeocode.longitude,
    });

  const orderCoordinates: Array<number> = orderCoordinatesData.map(
    (client) => client.id
  );

  return { coordinates, orderCoordinatesData, orderCoordinates }
}
