<template>
  <div class="list">
    <v-subheader>
      <v-btn icon ripple class="outer-handle mx-0">
        <v-icon color="grey lighten-1">mdi-drag-variant</v-icon>
      </v-btn>
      <editable
        v-if="canWrite"
        :content="list.title"
        placeholder="Set list title..."
        @update="changeTitle"
      />
      <div v-else>
        {{ list.title }}
      </div>

      <v-btn
        v-if="canWrite"
        icon ripple class="remove-checked"
        @click="removeChecked"
      >
        <v-icon color="grey lighten-1">mdi-close-circle</v-icon>
      </v-btn>

      <v-btn
        v-if="canWrite"
        icon ripple class="remove-list"
        @click="dialog = true"
      >
        <v-icon color="grey lighten-1">mdi-close-circle</v-icon>
      </v-btn>
    </v-subheader>

    <draggable v-model="items" handle=".inner-handle">
      <template v-for="item in items">
        <ListItem :item="item" :key="item['.key']"
                  :loading="isLoading(item['.key'])" @update="updateItem"
                  @remove="removeItem" />
      </template>
    </draggable>

    <v-list-tile v-if="canWrite" class="new-item">
      <v-list-tile-action>
        <v-btn icon ripple class="add-item" @click="addItemFocus">
          <v-icon color="grey lighten-1">add</v-icon>
        </v-btn>
      </v-list-tile-action>

      <v-list-tile-content>
        <v-list-tile-title>
          <editable
            ref="newItemEl"
            :save-on-input="false"
            :content="newItem.title"
            placeholder="Add item..."
            @update="addItem(list, $event)"
          />
        </v-list-tile-title>
      </v-list-tile-content>
    </v-list-tile>

    <v-dialog v-if="dialog" v-model="dialog" max-width="290">
      <v-card>
        <v-card-title class="headline">Are you sure?</v-card-title>
        <v-card-actions>
          <v-spacer/>
          <v-btn color="secondary darken-1" flat="flat" @click.native="dialog = false">No</v-btn>
          <v-btn color="secondary darken-1" flat="flat" @click.native="remove">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import ListItem from '@/components/team/ListItem'
import editable from '@/components/editable'
import _ from 'lodash/fp'
import draggable from 'vuedraggable'

import { mapGetters } from 'vuex'

export default {
  components: {
    editable,
    ListItem,
    draggable,
  },

  props: {
    list: {
      type: Object,
      required: true,
    },
  },

  data () {
    return {
      newItem: { title: '' },
      dialog: false,
      loading: [],
    }
  },

  computed: {
    ...mapGetters(['canWrite']),

    items: {
      get () {
        if (!this.list.items) { return [] }

        return Object.keys(this.list.items).map((key) =>
          Object.assign({ '.key': key }, this.list.items[key])
        ).sort((a, b) => a.order - b.order)
      },
      set (value) {
        this.$store.dispatch('lists/reorder', { list: this.list, items: value })
      },
    },

    isLoading () {
      return (key) => _.includes(key, this.loading)
    },
  },

  watch: {
    dialog (value) {
      if (value) {
        window.addEventListener('keyup', this.handleKeyPress)
      } else {
        window.removeEventListener('keyup', this.handleKeyPress)
      }
    },
  },

  methods: {
    handleKeyPress (event) {
      if (event.keyCode === 13 && this.dialog === true) {
        this.remove()
      } else if (event.keyCode === 27) {
        this.dialog = false
      }
    },

    addItemFocus () {
      this.$refs.newItemEl.$el.lastChild.focus()
    },

    async addItem (list, value) {
      if (value === '') { return }

      this.newItem.title = value
      await this.$store.dispatch('lists/saveItem', { listKey: this.list['.key'], item: { ...this.newItem } })
      this.newItem = { title: '' }
      this.$refs.newItemEl.clear()
    },

    async updateItem (item) {
      this.loading.push(item['.key'])
      await this.$store.dispatch('lists/saveItem', { listKey: this.list['.key'], item })
      this.loading.splice(this.loading.indexOf(item['.key']), 1)
    },

    removeItem (key) {
      this.$store.dispatch('lists/removeItem', { listKey: this.list['.key'], key })
    },

    changeTitle (title) {
      this.$store.dispatch('lists/save', { '.key': this.list['.key'], title })
    },

    remove () {
      this.dialog = false
      this.$store.dispatch('lists/remove', this.list['.key'])
    },

    removeChecked () {
      for (let item of this.items) {
        if (item['checked'] !== undefined && item['checked'] === true) {
          console.log('Attempting to delete checked item ...')
          let key = item['.key']
          this.$store.dispatch('lists/removeItem', { listKey: this.list['.key'], key: key }, key)
        }
      }
    },
  },
}
</script>

<style lang="stylus">
.lists .list
  .v-subheader
    padding: 0

  .v-list__tile
    min-height: 2.5rem
    height: auto

    .v-list__tile__content
      overflow-wrap: break-word
</style>
