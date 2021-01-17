<template>
  <article>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <nav class="breadcrumb" aria-label="breadcrumbs">
            <ul>
              <li><a href="#">Projects</a></li>
              <li><a href="#" aria-current="page">FYM</a></li>
            </ul>
          </nav>
          <div class="is-flex is-align-items-center mb-5">
            <h1 class="title m-0">Create report</h1>
            <b-button rounded type="is-info" size="" class="ml-4 text--smallcaps" :disabled="!enabled">Trigger 🗲</b-button>
          </div>
          <p class="subtitle mt-4 mb-2">

          </p>
          <table class="mini-status table is-narrow">
            <tr>
              <th>Enabled</th>
              <td>
                <b-switch v-model="enabled"/>
              </td>
            </tr>

            <tr>
              <th>Action</th>
              <td><code>POST https://asd</code></td>
            </tr>
            <tr>
              <th>Schedule</th>
              <td><code>*/25 * * * *</code></td>
            </tr>
            <tr>
              <th>Last Run</th>
              <td><b class="tag is-danger is-light">FAILED</b></td>
            </tr>
            <tr>
              <th>Last Run</th>
              <td><b class="tag is-success is-light">SUCCESS</b></td>
            </tr>
          </table>
        </div>
      </div>
    </section>
    <section class="container py-6">
      <h2 class="title is-size-4">Latest runs</h2>

      <b-table
          :data="runs">
        <b-table-column field="startedAt" label="Started At"/>
        <b-table-column field="finishedAt" label="Finished At"/>
        <b-table-column field="status" label="Status"/>
      </b-table>
    </section>
  </article>
</template>

<script>
export default {
  name: "TriggerView",
  data() {
    return {
      enabled: true,
      runs: [
        {id: '', startedAt: '2020-12-12 12:34', finishedAt: '2020-12-12 12:36'}
      ]
    }
  },
  methods: {}
}
</script>

<style scoped>
p > .tag {
  /*vertical-align: bottom;*/
}
</style>