import { firebaseMutations, firebaseAction } from 'vuexfire'
import history from '@/history'
import _ from 'lodash/fp'

export default {
  namespaced: true,

  state: {
    history: [],
  },

  mutations: {
    setCollection (state, collection) { state.collection = collection },
    ...firebaseMutations,
  },

  getters: {
    all (state, getters) {
      // disregard history entries created > 3 timeslots ago
      const startDate = getters.currentScaledDate - 3
      const withKey = entities =>
        _.map(key =>
          _.assign({ id: key }, entities[key]),
        )(_.keys(entities))

      return _.flow(
        _.filter(_.flow(_.prop('id'), parseInt, _.lte(_, startDate))),
        _.map(h => _.assoc('entities', withKey(h.entities), h)),
      )(state.history)
    },

    currentScaledDate (_state, _getters, rootState) {
      return history.scaleDate(rootState.shared.now)
    },
  },

  actions: {
    setCollection: firebaseAction(({ bindFirebaseRef, commit }, collection) => {
      bindFirebaseRef('history', collection.orderBy('timestamp').limit(100))
      commit('setCollection', collection)
    }),
  },
}
