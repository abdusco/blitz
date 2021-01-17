<template>
  <b-tooltip position="is-left" class="is-flex" :type="isValid ? 'is-info': 'is-warning'" :always="always">
    <slot/>
    <template v-slot:content>
      <article v-if="isValid">
        <h2 class="is-6 has-text-weight-semibold">Description</h2>
        <p>{{ description }}</p>

        <h2 class="is-6 has-text-weight-semibold mt-2">Estimated schedule</h2>
        <ul v-if="nextDates.length">
          <li v-for="(date, i) in nextDates" :key="+date">{{ formatDate(date) }}</li>
        </ul>
      </article>
      <span v-else>Invalid cron!</span>
    </template>
  </b-tooltip>
</template>

<script>
import {calculateNextDates} from "@/utils/cron";
import cronstrue from 'cronstrue'

export default {
  name: "CronExpression",
  props: ['value', 'always'],
  computed: {
    nextDates() {
      return calculateNextDates(this.value);
    },
    isValid() {
      return !!this.parsed;
    },
    parsed() {
      try {
        return cronstrue.toString(this.value, {
          use24HourTimeFormat: true,
          verbose: false,
        })
      } catch (e) {
        return undefined;
      }
    },
    description() {
      return this.parsed;
    }
  }
}
</script>
