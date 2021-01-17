<template>
  <article>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <nav class="breadcrumb" aria-label="breadcrumbs">
            <ul>
              <li><a href="#">Projects</a></li>
              <li><a href="#" aria-current="page">FYM</a></li>
              <li><a href="#" aria-current="page" class="is-active">Create report</a></li>
            </ul>
          </nav>
          <h1 class="title mt-4">
            Run #1322
          </h1>
          <table class="mini-status table is-narrow">
            <tr>
              <th>Triggered at</th>
              <td>2020-12-23</td>
            </tr>
            <tr>
              <th>Status</th>
              <td><b class="tag is-info is-light">IN PROGRESS</b></td>
            </tr>
          </table>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title is-4">Details</h2>
        <table class="table is-striped is-fullwidth is-hoverable">
          <thead>
          <tr>
            <th class="is-column-min">Key</th>
            <th>Value</th>
          </tr>
          </thead>
          <tr v-for="(v,k) in flattenObject(details)" :key="k">
            <th><span class="text--nowrap">{{ k }}</span></th>
            <td>
              <pre class="detail-item"><code>{{ v }}</code></pre>
            </td>
          </tr>
        </table>
      </div>
    </section>
  </article>
</template>

<script>
import flattenObject from '../utils/flattenObject'

export default {
  name: "RunView",
  data() {
    return {
      details: {
        triggeredAt: '2020-12-12 23:23',
        startedAt: '2020-12-12 23:23',
        finishedAt: '2020-12-12 23:23',
        error: {
          message: 'Error at',
          stackTrace: 'WER.RT.A:HelloWorld\n123123',
        },
        runTime: '12s'
      }
    }
  },
  methods: {
    flattenObject
  }
}
</script>

<style scoped>
.mini-status {
  background-color: transparent;
}

.mini-status td, .mini-status th {
  border: 0;
}

.detail-item {
  padding: 0;
  background-color: transparent;
  font-size: inherit;
}
</style>