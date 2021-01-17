<template>
  <article>
    <section class="hero is-light">
      <div class="hero-body">
        <div class="container">
          <nav class="breadcrumb" aria-label="breadcrumbs">
            <ul>
              <li><a href="#">Projects</a></li>
            </ul>
          </nav>
          <h1 class="title is-flex is-align-items-center">FYM</h1>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <h2 class="title is-4">Create a new trigger</h2>
        <create-cronjob-form :project="project"/>
      </div>
    </section>
    <div class="section">
      <div class="container">
        <h2 class="title is-4">Triggers</h2>
        <b-table :data="triggers">
          <b-table-column label="Title" field="title"/>
          <b-table-column label="URL" field="url"/>
          <b-table-column label="Schedule" field="cron"/>
          <b-table-column label="Last Run" field="lastRunStatus"/>
        </b-table>
      </div>
    </div>
  </article>
</template>

<script>
import CreateCronjobForm from "@/components/CreateTriggerForm";

export default {
  name: "ProjectView",
  components: {CreateCronjobForm},
  data() {
    return {
      triggers: [],
      project: {
        id: 10,
        title: 'FYM'
      }
    }
  }
}
</script>

<style scoped>

</style>