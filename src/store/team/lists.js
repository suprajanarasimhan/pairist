import { vuexfireMutations, firestoreAction } from 'vuexfire'

export default {
  namespaced: true,

  state: {
    lists: [],
  },

  mutations: {
    setCollection (state, collection) { state.collection = collection },
    ...vuexfireMutations,
  },

  getters: {
    all (state) {
      return state.lists.map(list => ({
        id: list.id,
        ...list,
      }))
    },
  },

  actions: {
    setCollection: firestoreAction(({ bindFirestoreRef, commit }, collection) => {
      bindFirestoreRef('lists', collection.orderBy('order'))
      commit('setCollection', collection)
    }),

    async saveItem ({ state }, { list, item, index }) {
      if (index !== undefined) {
        const items = list.items
        items[index] = { ...items[index], ...item }
        await state.collection.doc(list.id).update({ items })
      } else {
        const items = list.items
        items.push({ title: item.title, order: 0 })
        await state.collection.doc(list.id).update({ items })
      }
    },

    reorderLists ({ state }, lists) {
      lists.forEach((list, order) => {
        state.collection.doc(list.id).update({ order })
      })
    },

    async removeItem ({ state }, { list, index }) {
      const items = list.items
      items.splice(items.indexOf(index), 1)
      await state.collection.doc(list.id).update({ items })
    },

    save ({ state }, list) {
      if (list.id) {
        const key = list.id
        delete list.id

        state.collection.doc(key).update(list)
      } else {
        state.collection.add({
          title: list.title || '',
          items: [],
          order: 0,
        })
      }
    },

    reorder ({ state }, { list, items }) {
      const newItems = items.map((item, order) => (
        {
          ...item,
          order,
          checked: false,
        }
      ))
      state.collection.doc(list.id).update({ items: newItems })
    },

    remove ({ state }, key) {
      state.collection.doc(key).delete()
    },
  },
}
