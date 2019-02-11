import { firebaseMutations, firebaseAction } from 'vuexfire'
import _ from 'lodash/fp'
import moment from 'moment'

import constants from '@/lib/constants'

export default {
  namespaced: true,

  state: {
    entities: [],
  },

  mutations: {
    setCollection (state, collection) { state.collection = collection },
    ...firebaseMutations,
  },

  getters: {
    byKey (state) {
      return key =>
        _.find(e => e.id === key)(state.entities)
    },
    all (state) {
      return state.entities
    },
    byType (state) {
      return type =>
        _.filter(e => e.type === type)(state.entities)
    },
    unassigned (_, getters) {
      return type =>
        getters.inLocation(constants.LOCATION.UNASSIGNED)(type)
    },
    out (_, getters) {
      return type =>
        getters.inLocation(constants.LOCATION.OUT)(type)
    },
    pm (_, getters) {
      return type =>
        getters.inLocation(constants.LOCATION.PM)(type)
    },
    inLocation (state, getters) {
      return location =>
        type =>
          _.filter(entity => entity.location === location)(getters.byType(type))
    },
  },

  actions: {
    setCollection: firebaseAction(({ bindFirebaseRef, commit }, collection) => {
      bindFirebaseRef('entities', collection.orderBy('updatedAt'))
      commit('setCollection', collection)
    }),

    save ({ state }, entity) {
      if (entity.name === '') { return }

      if (entity.id) {
        const key = entity.id
        delete entity.id

        state.collection.doc(key).update(entity)
      } else {
        const entityToCreate = {
          ...entity,
          location: constants.LOCATION.UNASSIGNED,
          updatedAt: moment().valueOf(),
        }

        state.collection.add(entityToCreate)
      }
    },

    remove ({ dispatch, state }, key) {
      state.collection.doc(key).remove()
      dispatch('lanes/clearEmpty', null, { root: true })
    },

    resetLocation ({ getters, dispatch, state }, key) {
      getters.all.filter(e => e.location === key).forEach(e => {
        dispatch('move', { key: e.id, location: constants.LOCATION.UNASSIGNED })
      })
      dispatch('lanes/clearEmpty', null, { root: true })
    },

    async move ({ getters, state }, { key, location }) {
      const entity = getters.byKey(key)
      if (!entity) { return }

      if (entity.type !== 'person' && location === constants.LOCATION.OUT) {
        location = constants.LOCATION.UNASSIGNED
      }

      const payload = {
        location,
        updatedAt: moment().valueOf(),
      }

      await state.collection.doc(key).update(payload)
    },
  },
}
