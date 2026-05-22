table "users" {
  schema = schema.main
  column "id" {
    null           = false
    type           = integer
    auto_increment = true
  }
  column "username" {
    null = false
    type = text
  }
  column "password_hash" {
    null = false
    type = text
  }
  column "created_at" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  primary_key {
    columns = [column.id]
  }
  index "idx_username" {
    unique  = true
    columns = [column.username]
  }
}

table "sessions" {
  schema = schema.main
  column "id" {
    null = false
    type = text
  }
  column "user_id" {
    null = false
    type = integer
  }
  column "token" {
    null = false
    type = text
  }
  column "expires_at" {
    null = false
    type = datetime
  }
  column "created_at" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "user_id_fk" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
  index "idx_token" {
    unique  = true
    columns = [column.token]
  }
}

table "tasks" {
  schema = schema.main
  column "id" {
    null           = false
    type           = integer
    auto_increment = true
  }
  column "user_id" {
    null = false
    type = integer
  }
  column "title" {
    null = false
    type = text
  }
  column "description" {
    null = true
    type = text
  }
  column "status" {
    null    = false
    type    = text
    default = "pending"
  }
  column "created_at" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  column "updated_at" {
    null    = false
    type    = datetime
    default = sql("CURRENT_TIMESTAMP")
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "user_id_fk" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = CASCADE
  }
}

schema "main" {}
