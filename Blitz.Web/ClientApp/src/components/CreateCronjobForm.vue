<template>
  <form @submit.prevent="onSubmit">
    <div class="columns">
      <div class="column is-one-quarter" v-if="!project">
        <b-field label="Project" message="Which project this cronjob belong to?">
          <b-autocomplete v-model="selectedProject" :data="projects" :custom-formatter="it => it.title" open-on-focus
                          clearable keep-first
                          @select="onSelectProject"
                          required>
            <template v-slot:header>
              <a class="is-fullwidth is-block" v-on:click="redirectToCreateProjects">
                <b>Add new... </b>
              </a>
            </template>
            <template v-slot:empty>
              Nothing
            </template>
          </b-autocomplete>
        </b-field>
      </div>
      <input v-else type="hidden" name="projectId" v-model="project.id">
      
      <div class="column">
        <b-field label="Title" message="A short title">
          <b-input v-model="form.title" name="title" placeholder="Email reports" required></b-input>
        </b-field>
      </div>
      <div class="column is-one-quarter">
        <b-tooltip position="is-left" class="is-flex">
          <b-field label="Schedule" message="Cron expression">
            <b-input v-model="form.cron" name="cron" placeholder="*/15 * * * *" class="is-family-monospace"
                     required></b-input>
          </b-field>
          <template v-slot:content>
            <aside>
              <p class="mb-2"><b>Description</b><br>Every 25 minutes</p>
              <b>Estimated schedule</b>
              <ul>
                <li>2020-12-12 12:12</li>
                <li>2020-12-12 12:12</li>
                <li>2020-12-12 12:12</li>
              </ul>
            </aside>
          </template>
        </b-tooltip>
      </div>
    </div>

    <div class="columns">
      <div class="column is-three-quarters">
        <b-field label="URL" message="URL must be publicly accessible">
          <b-input v-model="form.url" name="url" type="url" placeholder="https://url/to/endpoint" required></b-input>
        </b-field>
      </div>
      <div class="column">
        <b-field label="HTTP Method">
          <b-radio v-model="form.httpMethod"
                   name="httpMethod"
                   required
                   native-value="GET">
            GET
          </b-radio>
          <b-radio v-model="form.httpMethod"
                   name="httpMethod"
                   required
                   native-value="POST">
            POST
          </b-radio>
        </b-field>
      </div>
    </div>
    <!--    <pre>{{ form }}</pre>-->
    <b-button type="is-primary" rounded native-type="submit">Save</b-button>
  </form>
</template>

<script>
export default {
  name: "CreateCronjobForm",
  props: ['project'],
  data() {
    return {
      projects: [{id: '10', title: 'FYM'}],
      selectedProject: '',
      form: {
        projectId: this.project?.id,
        title: '',
        cron: '',
        url: '',
        httpMethod: 'POST',
      }
    }
  },
  methods: {
    onSubmit() {
      let cronjob = {...this.form};
      this.$emit('create', cronjob);
    },
    onSelectProject(project) {
      console.log(project);
      this.form.projectId = project?.id;
    },
    redirectToCreateProjects() {
      alert('redirect!');
    },
  },
}
</script>

<style scoped>

</style>