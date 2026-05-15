/**
 * In-Memory Data Store
 * Provides Mongoose-like interface when MongoDB is unavailable
 */

class MemoryStore {
  constructor() {
    this.drones = [];
    this.flights = [];
    this.orders = [];
    this.users = [];
    this.alerts = [];
    this.geofences = [];
    this.digitalTwins = [];
    this.revenues = [];
    this.nextId = 1000;
  }

  // Drone operations
  async saveDrone(droneData) {
    const drone = { ...droneData, _id: this.nextId++, createdAt: new Date(), updatedAt: new Date() };
    this.drones.push(drone);
    return drone;
  }

  async findDrones(query = {}) {
    return this.drones.filter(d => {
      for (const key in query) {
        if (d[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findDrone(id) {
    return this.drones.find(d => d._id === id || d.id === id);
  }

  async droneFindOne(query = {}) {
    return this.findDrones(query)[0] || null;
  }

  async droneCount(query = {}) {
    return (await this.findDrones(query)).length;
  }

  async insertDrones(droneList) {
    const inserted = droneList.map(d => ({
      ...d,
      _id: this.nextId++,
      id: d.id || `drone-${this.nextId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    this.drones.push(...inserted);
    return inserted;
  }

  // Flight operations
  async saveFlight(flightData) {
    const flight = { ...flightData, _id: this.nextId++, createdAt: new Date(), updatedAt: new Date() };
    this.flights.push(flight);
    return flight;
  }

  async findFlights(query = {}) {
    return this.flights.filter(f => {
      for (const key in query) {
        if (f[key] !== query[key]) return false;
      }
      return true;
    });
  }

  // Order operations
  async saveOrder(orderData) {
    const order = { ...orderData, _id: this.nextId++, createdAt: new Date(), updatedAt: new Date() };
    this.orders.push(order);
    return order;
  }

  async findOrders(query = {}) {
    return this.orders.filter(o => {
      for (const key in query) {
        if (o[key] !== query[key]) return false;
      }
      return true;
    });
  }

  async findOrder(id) {
    return this.orders.find(o => o._id === id || o.id === id);
  }

  // Alert operations
  async saveAlert(alertData) {
    const alert = { ...alertData, _id: this.nextId++, createdAt: new Date() };
    this.alerts.push(alert);
    return alert;
  }

  async findAlerts(query = {}) {
    return this.alerts.filter(a => {
      for (const key in query) {
        if (a[key] !== query[key]) return false;
      }
      return true;
    });
  }

  // Clear all data
  clear() {
    this.drones = [];
    this.flights = [];
    this.orders = [];
    this.users = [];
    this.alerts = [];
    this.geofences = [];
    this.digitalTwins = [];
    this.revenues = [];
    this.nextId = 1000;
  }

  // Get all data
  getAllData() {
    return {
      drones: this.drones,
      flights: this.flights,
      orders: this.orders,
      users: this.users,
      alerts: this.alerts,
      geofences: this.geofences,
      digitalTwins: this.digitalTwins,
      revenues: this.revenues,
    };
  }
}

// Singleton instance
let instance = null;

function getInstance() {
  if (!instance) {
    instance = new MemoryStore();
  }
  return instance;
}

module.exports = {
  getInstance,
  MemoryStore,
};
