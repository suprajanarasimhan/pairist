import { vuexfireMutations, firestoreAction } from 'vuexfire'
import _ from 'lodash/fp'

export default {
  namespaced: true,

  state: {
    lanes: [],

    lastAddedID: null,
  },

  mutations: {
    setRef (state, ref) { state.ref = ref },
    laneAdded (state, id) { state.lastAddedID = id },
    ...vuexfireMutations,
  },

  getters: {
    all (state, _getters, _rootState, rootGetters) {
      return _.map(lane => (
        {
          id: lane.id,
          people: rootGetters['entities/inLocation'](lane.id)('person'),
          tracks: rootGetters['entities/inLocation'](lane.id)('track'),
          roles: rootGetters['entities/inLocation'](lane.id)('role'),
          ...lane,
        }
      ))(state.lanes)
    },

    lastAddedID (state) { return state.lastAddedID },
  },

  actions: {
    setRef: firestoreAction(({ bindFirestoreRef, commit }, ref) => {
      bindFirestoreRef('lanes', ref)
      commit('setRef', ref)
    }),

    async add ({ commit, state }) {
      const id = (await state.ref.add({ sortOrder: 0 })).id
      commit('laneAdded', id)
    },

    remove ({ state }, key) {
      state.ref.doc(key).delete()
    },

    setLocked ({ state }, { key, locked }) {
      state.ref.doc(key).update({ locked })
    },

    clearEmpty ({ dispatch, getters }) {
      _.forEach(lane => {
        if (lane.people.length === 0 && lane.tracks.length === 0 && lane.roles.length === 0) {
          dispatch('remove', lane.id)
        }
      }, getters.all)
    },
  },
}
