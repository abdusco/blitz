<template>
  <b-tooltip position="is-left" class="is-flex" :type="isValid ? 'is-white': 'is-warning'" :always="always">
    <slot/>
    <template v-slot:content>
      <article v-if="isValid" class="py-2">
        <h2 class="is-6 has-text-weight-semibold has-text-primary">Description</h2>
        <p>{{ description }}</p>

        <h2 class="is-6 has-text-weight-semibold has-text-primary mt-2">Estimated schedule</h2>
        <ul v-if="nextDates.length">
          <li v-for="(date, i) in nextDates" :key="+date"><code>{{ formatDate(date) }}</code></li>
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
