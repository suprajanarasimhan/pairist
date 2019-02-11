import store from '@/store/team/history'

describe('History Store', () => {
  describe('mutations', () => {
    describe('setRef', () => {
      it('sets the ref', () => {
        const ref = { ref: 'ref' }
        const state = {}

        store.mutations.setRef(state, ref)
        expect(state.ref).toBe(ref)
      })
    })
  })

  describe('getters', () => {
    describe('all', () => {
      it('filters history from after currentScaledDate-3', () => {
        const history = [
          { id: '999', before: null },
          { id: '1000', at: null },
          { id: '1001', after: null },
        ]
        const currentScaledDate = 1003

        expect(store.getters.all({ history }, { currentScaledDate })).toEqual([
          { id: '999', before: null, entities: [] },
          { id: '1000', at: null, entities: [] },
        ])
      })

      it('adds .key to entities', () => {
        const history = [
          {
            id: '999',
            entities: {
              e1: { name: 'name' },
              e2: { name: 'name' },
            },
          },
          {
            id: '1000',
            entities: {
              e3: { name: 'name' },
              e4: { name: 'name' },
            },
          },
        ]
        const currentScaledDate = 1003

        expect(store.getters.all({ history }, { currentScaledDate })).toEqual([
          {
            id: '999',
            entities: [
              { id: 'e1', name: 'name' },
              { id: 'e2', name: 'name' },
            ],
          },
          {
            id: '1000',
            entities: [
              { id: 'e3', name: 'name' },
              { id: 'e4', name: 'name' },
            ],
          },
        ])
      })
    })
  })
})
