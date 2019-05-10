import { firestoreAction } from 'vuexfire'
import _ from 'lodash/fp'

import { db } from '@/firebase'

import constants from '@/lib/constants'
import entities from './entities'
import lanes from './lanes'
import history from './history'
import lists from './lists'

import history_ from '@/history'
import { calculateMovesToBestPairing, calculateMovesToBestAssignment } from '@/lib/recommendation'

export default {
  modules: {
    entities,
    lanes,
    history,

    lists,
  },

  state: {
    current: null,
    public: null,
    teamRef: null,
    canRead: false,
    canWrite: false,

    dragging: false,
    dropTarget: null,

    loadedKey: null,
  },

  mutations: {
    authorize (state, { read, write }) {
      state.canRead = read
      state.canWrite = write
    },

    setDragging (state, value) {
      state.dragging = value
    },

    setDropTarget (state, value) {
      state.dropTarget = value
    },
  },

  getters: {
    showingDate ({ loadedKey }, getters) {
      if (!loadedKey || isNaN(loadedKey)) { return null }

      return getters.toDate(loadedKey)
    },

    toDate () {
      return (key) => history_.toDate(key)
    },

    dragging (state) { return state.dragging },
    dropTarget (state) { return state.dropTarget },

    publicRO (state) {
      return state.public && state.public['.value']
    },
    current (state) {
      return state.current
    },
    canRead (state) {
      return state.canRead
    },
    canWrite (state) {
      return state.canWrite
    },
  },

  actions: {
    loadTeamRefs: firestoreAction(({ bindFirestoreRef, dispatch }, currentRef) => {
      bindFirestoreRef('current', currentRef)

      dispatch('entities/setCollection',
        currentRef.collection('entities'))

      dispatch('lanes/setCollection',
        currentRef.collection('lanes'))
    }),

    loadTeam: firestoreAction(async ({ bindFirestoreRef, commit, dispatch, state }, teamName) => {
      commit('loading', true)
      const teamRef = db.doc(`/teams/${teamName}`)

      await bindFirestoreRef('team', teamRef)
      state.teamRef = teamRef

      await dispatch('history/setCollection',
        db.collection(`/teams/${teamName}/history`))

      await dispatch('lists/setCollection',
        db.collection(`/teams/${teamName}/lists`))

      state.teamName = teamName
      commit('loading', false)
    }),

    async loadState ({ commit, state, dispatch }, key) {
      commit('loading', true)
      if (key === 'current') {
        const currentRef = db.doc(`/teams/${state.teamName}/history/current`)
        dispatch('loadTeamRefs', currentRef)
      } else {
        dispatch('loadTeamRefs', db.doc(`/teams/${state.teamName}/history/${key}`))
      }

      state.loadedKey = key
      commit('loading', false)
    },

    async authorize ({ commit }, teamName) {
      try {
        await db.doc(`/teams/${teamName}`).update({ writecheck: 0 })
        commit('authorize', { read: true, write: true })
        return
      } catch (error) {
        console.log(error)
        try {
          await db.doc(`/teams/${teamName}`).get().public
          commit('authorize', { read: true, write: false })
        } catch (error) {
          commit('authorize', { read: false, write: false })
          commit('notify', {
            message: "You don't have permissions to view this team.",
            color: 'error',
          })
        }
      }
    },

    async setPublic ({ commit, state }, value) {
      commit('loading', true)
      await state.teamRef.update({ public: value })
      commit('loading', false)
    },

    async recordHistory () {
    },

    async move ({ getters, dispatch }, { key, targetKey }) {
      let location

      if (targetKey === 'new-lane') {
        await dispatch('lanes/add')
        location = getters['lanes/lastAddedID']
      } else if (targetKey) {
        location = targetKey
      } else {
        location = constants.LOCATION.UNASSIGNED
      }

      await dispatch('entities/move', { key, location })
      dispatch('lanes/clearEmpty')
    },

    applyMoves ({ commit, getters, dispatch }, pairsAndLanes) {
      _.forEach(({ entities, lane }) => {
        if (lane === 'new-lane') {
          Promise.resolve(dispatch('lanes/add'))
          lane = getters['lanes/lastAddedID']
        }

        _.forEach(key => {
          dispatch('move', {
            key: key,
            targetKey: lane,
          })
        }, entities)
      }, pairsAndLanes)
    },

    recommendRoles ({ commit, dispatch, getters }) {
      const moves = calculateMovesToBestAssignment({
        left: 'person',
        right: 'role',
        history: getters['history/all'].slice(),
        current: {
          entities: getters['entities/all'].slice(),
          lanes: getters['lanes/all'].slice(),
        },
      })

      if (moves) {
        dispatch('applyMoves', moves)
      }
    },

    recommendPairs ({ commit, dispatch, getters }) {
      const moves = calculateMovesToBestPairing({
        history: getters['history/all'].slice(),
        current: {
          entities: getters['entities/all'].slice(),
          lanes: getters['lanes/all'].slice(),
        },
      })

      if (moves) {
        if (moves.length === 0) {
          commit('notify', {
            message: 'Pairing setting is already the optimal one. No actions taken',
            color: 'accent',
          })
        } else {
          Promise.resolve(dispatch('applyMoves', moves))
        }
        dispatch('recommendRoles')
      } else {
        commit('notify', {
          message: 'Cannot make a valid pairing assignment. Do you have too many lanes?',
          color: 'warning',
        })
      }
    },
  },
}
