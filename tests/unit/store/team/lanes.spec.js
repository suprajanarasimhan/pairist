import store from '@/store/team/lanes'

describe('Lanes Store', () => {
  describe('mutations', () => {
    describe('setRef', () => {
      it('sets the ref', () => {
        const ref = { ref: 'ref' }
        const state = {}

        store.mutations.setRef(state, ref)
        expect(state.ref).toBe(ref)
      })
    })

    describe('laneAdded', () => {
      it('sets lastAddedID state', () => {
        const lastAddedID = { lastAddedID: 'lastAddedID' }
        const state = {}

        store.mutations.laneAdded(state, lastAddedID)
        expect(state.lastAddedID).toBe(lastAddedID)
      })
    })
  })

  describe('getters', () => {
    describe('all', () => {
      it('returns the lanes from the state with entities from root', () => {
        const lanes = [
          { id: 1 }, { id: 2 }, { id: 3 },
        ]
        const rootGetters = {
          'entities/inLocation': jest.fn().mockImplementation((key) =>
            (type) => ({ [type]: key })),
        }

        const result = store.getters.all({ lanes }, null, null, rootGetters)
        expect(result).toEqual([
          { id: 1, people: { person: 1 }, tracks: { track: 1 }, roles: { role: 1 } },
          { id: 2, people: { person: 2 }, tracks: { track: 2 }, roles: { role: 2 } },
          { id: 3, people: { person: 3 }, tracks: { track: 3 }, roles: { role: 3 } },
        ])
      })
    })

    describe('lastAddedID', () => {
      it('returns the last added key', () => {
        const lastAddedID = { lastAddedID: 'lastAddedID' }

        expect(store.getters.lastAddedID({ lastAddedID })).toBe(lastAddedID)
      })
    })
  })

  describe('actions', () => {
    describe('add', () => {
      it('pushes the lane into the ref', async () => {
        const add = jest.fn().mockReturnValue({ id: 'the-key' })
        const commit = jest.fn()
        const state = { ref: { add } }

        await store.actions.add({ commit, state })
        expect(add).toHaveBeenCalledTimes(1)
        expect(add).toHaveBeenCalledWith({ sortOrder: 0 })
      })

      it('commits the lane back to added', async () => {
        const add = jest.fn().mockReturnValue({ id: 'the-key' })
        const commit = jest.fn()
        const state = { ref: { add } }

        await store.actions.add({ commit, state }, { name: '' })
        expect(commit).toHaveBeenCalledTimes(1)
        expect(commit).toHaveBeenCalledWith('laneAdded', 'the-key')
      })
    })

    describe('remove', () => {
      it('removes lane from ref', () => {
        const dispatch = jest.fn()
        const remove = jest.fn()
        const doc = jest.fn().mockReturnValue({ delete: remove })
        const state = { ref: { doc } }

        store.actions.remove({ dispatch, state }, 'key')
        expect(doc).toHaveBeenCalledTimes(1)
        expect(doc).toHaveBeenCalledWith('key')
        expect(remove).toHaveBeenCalledTimes(1)
        expect(remove).toHaveBeenCalledWith()
      })
    })

    describe('setLocked', () => {
      it('sets the locked value (false)', () => {
        const dispatch = jest.fn()
        const update = jest.fn()
        const doc = jest.fn().mockReturnValue({ update })
        const state = { ref: { doc } }

        store.actions.setLocked({ dispatch, state }, { key: 'key', locked: false })
        expect(doc).toHaveBeenCalledTimes(1)
        expect(doc).toHaveBeenCalledWith('key')
        expect(update).toHaveBeenCalledTimes(1)
        expect(update).toHaveBeenCalledWith({ locked: false })
      })

      it('sets the locked value (true)', () => {
        const dispatch = jest.fn()
        const update = jest.fn()
        const doc = jest.fn().mockReturnValue({ update })
        const state = { ref: { doc } }

        store.actions.setLocked({ dispatch, state }, { key: 'other-key', locked: true })
        expect(doc).toHaveBeenCalledTimes(1)
        expect(doc).toHaveBeenCalledWith('other-key')
        expect(update).toHaveBeenCalledTimes(1)
        expect(update).toHaveBeenCalledWith({ locked: true })
      })
    })

    describe('clearEmpty', () => {
      it('dispatches remove for any lanes with no entites', () => {
        const lanes = [
          { id: 1, people: [], tracks: [], roles: [] },
          { id: 2, people: [2], tracks: [], roles: [] },
          { id: 3, people: [], tracks: [3], roles: [] },
          { id: 4, people: [], tracks: [], roles: [4] },
          { id: 5, people: [5], tracks: [5], roles: [5] },
        ]
        const dispatch = jest.fn()
        const getters = { all: lanes }

        store.actions.clearEmpty({ dispatch, getters })
        expect(dispatch).toHaveBeenCalledTimes(1)
        expect(dispatch).toHaveBeenCalledWith('remove', 1)
      })
    })
  })
})
