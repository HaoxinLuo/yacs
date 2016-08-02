class Api::V5::CoursesController < Api::V5::ApiController
  caches_action :index, if: Proc.new { |c| c.params[:department_id].present? && @show_sections && @show_periods },
    cache_path: Proc.new { |c| "/api/v5/courses.json?department_id=#{c.params[:department_id]}" } # TODO: rework caching scheme

  def index
    if params[:search].present?
      @query = Course.search params[:search].gsub(/[^0-9a-z\s]/i, '').split
    elsif params[:name_search].present?
      filter_model Course
      query.includes! :sections
      @names = {}
      any(:section_id).each do |id|
        course = query.where :"sections.id" => id
        section = course[0].sections.where :id => id
        @names[id] = "#{course[0].name} section #{section[0].name}"
      end
    else
      filter_model Course
      filter :section_id do |q|
        q.joins(:sections).where :"sections.id" => any(:section_id)
      end
      filter :department_code do |q|
        q.joins(:department).where :"departments.code" => any(:department_code)
      end
      filter_any :id, :department_id, :name, :number, :min_credits, :max_credits
      query.includes! :sections if @show_sections
    end
  end
end
