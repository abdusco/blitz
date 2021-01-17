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
        <cron-expression :value="form.cron" :always="showCronInfo">
          <b-field label="Schedule" message="Cron expression">
            <b-input v-model="form.cron"
                     name="cron"
                     placeholder="*/15 * * * *"
                     class="is-family-monospace"
                     @focus="showCronInfo = true"
                     @blur="showCronInfo = false"
                     required/>
          </b-field>
        </cron-expression>
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
import client from "@/api/client";
import CronExpression from "@/components/CronExpression";

export default {
  name: "CreateCronjobForm",
  components: {CronExpression},
  props: ['project'],
  data() {
    return {
      projects: [],
      selectedProject: '',
      showCronInfo: false,
      form: {
        projectId: this.project?.id,
        title: '',
        cron: '0 * * * *',
        url: '',
        httpMethod: 'POST',
      }
    }
  },
  async mounted() {
    this.projects = await client.listProjects();
  },
  methods: {
    onSubmit() {
      let cronjob = {...this.form};
      this.$emit('create', cronjob);
    },
    onSelectProject(project) {
      this.form.projectId = project?.id;
    },
    redirectToCreateProjects() {
      this.$router.push({name: 'projects'});
    },
  },
}
</script>

<style scoped>

</style>