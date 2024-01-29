export default {
  routes: [
    {
      method: 'GET',
      path: '/routeById/:id',
      handler: 'route.getClientsByRouteId'
    },
    {
      method: 'POST',
      path: '/routes/optimized',
      handler: 'route.optimized'
    }
  ]
}
