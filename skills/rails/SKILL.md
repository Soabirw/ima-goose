---
name: "rails"
description: "Ruby on Rails conventions + security - strong parameters, ActiveRecord safety, CSRF, auth, secrets management"
---

# Rails

Convention-over-configuration on the happy path. Work with Rails opinions, not against them.

**Foundation**: Reference `../ruby-fp/SKILL.md` for Ruby FP core. Business logic in service objects — keep models and controllers thin.

## 5 Non-Negotiable Security Practices

| Practice | Prevents | Rule |
|----------|----------|------|
| Strong Parameters | Mass assignment | `params.require(:model).permit(:field, ...)` on ALL controller actions |
| Parameterized Queries | SQL injection | ActiveRecord methods or `?`/named placeholders — NEVER string interpolation |
| CSRF Protection | CSRF | Never disable `protect_from_forgery`; use `form_with` helpers |
| Before Actions (Auth) | Unauthorized access | `before_action :authenticate_user!` on ALL sensitive actions |
| Secrets via Credentials | Credential exposure | Rails credentials or `ENV.fetch` — never hardcode |

```ruby
# 1. Strong Parameters
def user_params
  params.require(:user).permit(:name, :email, :bio)
  # Never: params[:user]  or  params.permit!
end

# 2. Parameterized Queries
User.where(email: params[:email])                          # safe
User.where("email = ?", params[:email])                    # safe
User.where("email = '#{params[:email]}'")                  # NEVER — SQL injection

# 3. CSRF — keep default
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception  # default — keep it
end

# 4. Before action auth
class PostsController < ApplicationController
  before_action :authenticate_user!
  before_action :require_admin, only: [:destroy]

  private
  def require_admin
    redirect_to root_path unless current_user&.admin?
  end
end

# 5. Credentials
Rails.application.credentials.stripe[:secret_key]
ENV.fetch('STRIPE_SECRET_KEY')  # raises KeyError if missing
```

## ActiveRecord Safety

```ruby
# SAFE
User.find(params[:id])
User.find_by(email: params[:email])
User.where(status: params[:status])
User.where("created_at > ?", 1.week.ago)
query = ActiveRecord::Base.sanitize_sql_like(params[:search])
User.where("name LIKE ?", "%#{query}%")

# UNSAFE — never
User.where("id = #{params[:id]}")
User.where("name LIKE '%#{params[:q]}%'")
User.find_by("email = '#{email}'")

# Raw SQL — use bind params
User.find_by_sql(["SELECT * FROM users WHERE token = ?", token])
```

## Mass Assignment

```ruby
# BAD
User.new(params[:user])
User.update(params.permit!)

# GOOD
def user_params
  params.require(:user).permit(:name, :email, :bio)
end
def post_params
  params.require(:post).permit(:title, :body, tags: [], author: [:name, :email])
end

# Set sensitive fields explicitly — never from params
def promote_to_admin
  @user.update!(role: 'admin')
end
```

## XSS in Views

```ruby
<%= user.name %>           # safe — HTML-escaped
<%== user.name %>          # UNSAFE — raw output
<%= raw user.name %>       # UNSAFE
<%= sanitize user.bio, tags: %w[b i em strong p] %>

# JS context — pass via data attributes, not interpolation
<div data-user-name="<%= user.name %>"></div>
```

## Authentication & Authorization

```ruby
class ApplicationController < ActionController::Base
  before_action :authenticate_user!
  skip_before_action :authenticate_user!, only: [:index, :show]
end

# Policy object (Pundit pattern)
class PostPolicy
  def initialize(user, post) = @user, @post = user, post
  def update? = @user.admin? || @post.user_id == @user.id
end

def update
  @post = Post.find(params[:id])
  return head :forbidden unless PostPolicy.new(current_user, @post).update?
  # update logic
end
```

## Controller Pattern

```ruby
class UsersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user, only: [:show, :update, :destroy]
  before_action :authorize_user!, only: [:update, :destroy]

  def show = render json: @user.as_json(only: [:id, :name, :email])

  def update
    if @user.update(user_params)
      render json: @user
    else
      render json: { errors: @user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def set_user = @user = User.find(params[:id])
  def authorize_user! = head :forbidden unless current_user.admin? || @user == current_user
  def user_params = params.require(:user).permit(:name, :email, :bio)
end
```

## Model: Thin, Validated

```ruby
class User < ApplicationRecord
  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :name, presence: true, length: { maximum: 100 }

  scope :active, -> { where(active: true) }
  scope :recent, -> { order(created_at: :desc) }

  before_save :normalize_email
  has_many :posts, dependent: :destroy

  private
  def normalize_email = self.email = email.to_s.strip.downcase
end
# Business logic → service objects
```

## Service Objects (Functional Core)

```ruby
class UserRegistrationService
  Result = Data.define(:success, :user, :errors)

  def self.call(attrs) = new(attrs).call

  def initialize(attrs) = @attrs = attrs

  def call
    user = User.new(normalized_attrs)
    if user.save
      WelcomeMailer.with(user: user).welcome_email.deliver_later
      Result.new(success: true, user: user, errors: [])
    else
      Result.new(success: false, user: nil, errors: user.errors.full_messages)
    end
  end

  private

  def normalized_attrs
    @attrs.slice(:name, :email, :password).merge(
      email: @attrs[:email].to_s.strip.downcase,
      name: @attrs[:name].to_s.strip
    )
  end
end

result = UserRegistrationService.call(user_params)
```

## File Organization

```
app/
├── controllers/   # Thin — delegate to services
├── models/        # Validations, scopes, associations only
├── services/      # Business logic
├── policies/      # Authorization rules
└── views/         # Only <%= %> — never <%== %>
config/
└── credentials.yml.enc  # Secrets (encrypted)
```

## Security Checklist

- [ ] Strong Parameters on all mutating actions
- [ ] No string interpolation in SQL queries
- [ ] `protect_from_forgery` enabled (default — don't remove)
- [ ] `before_action` auth on all sensitive routes
- [ ] No secrets in source — credentials or `ENV.fetch`
- [ ] ERB uses `<%= %>` not `<%== %>` for user content
- [ ] `sanitize` for user-supplied HTML
- [ ] `bundle exec bundler-audit check --update`

## Reference Files

| File | Load when |
|------|-----------|
| [`references/security.md`](references/security.md) | Vulnerable vs. safe comparisons, injection examples, CSP |
| [`references/activerecord.md`](references/activerecord.md) | Complex queries, raw SQL, migrations, N+1 prevention |
| [`references/testing.md`](references/testing.md) | RSpec patterns, factory patterns, security tests |
