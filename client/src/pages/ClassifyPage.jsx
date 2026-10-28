import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { classifyIssue } from '../services/api';
import ErrorAlert from '../components/ErrorAlert';
import './ClassifyPage.css';

const MAX_TITLE = 500;
const MAX_DESC = 10000;
const MAX_REPO = 200;

export default function ClassifyPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', description: '', repositoryName: '', githubIssueUrl: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    if (errors[name]) setErrors((e) => ({ ...e, [name]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required.';
    else if (form.title.length > MAX_TITLE) errs.title = `Title must be ${MAX_TITLE} characters or fewer.`;
    if (form.description.length > MAX_DESC) errs.description = `Description must be ${MAX_DESC} characters or fewer.`;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        ...(form.repositoryName.trim() && { repositoryName: form.repositoryName.trim() }),
        ...(form.githubIssueUrl.trim() && { githubIssueUrl: form.githubIssueUrl.trim() }),
      };
      const res = await classifyIssue(payload);
      const id = res.data.data.id || res.data.data._id;
      navigate(`/result/${id}`);
    } catch (err) {
      setApiError(err.message || 'Classification failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const titleLen = form.title.length;
  const descLen = form.description.length;

  return (
    <div className="classify-page">
      <div className="classify-page__header">
        <h1 className="page-title">Classify Issue</h1>
        <p className="page-subtitle">Enter a GitHub issue title and description to classify it.</p>
      </div>

      <div className="card classify-card">
        <ErrorAlert message={apiError} />

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">
              Issue Title <span className="required">*</span>
            </label>
            <input
              id="title"
              name="title"
              type="text"
              className={`form-control ${errors.title ? 'error' : ''}`}
              placeholder="e.g. Login button not responding after update"
              value={form.title}
              onChange={handleChange}
              maxLength={MAX_TITLE}
              aria-describedby={errors.title ? 'title-error' : undefined}
              aria-required="true"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {errors.title ? <span id="title-error" className="form-error">{errors.title}</span> : <span />}
              <span className={`char-count ${titleLen > MAX_TITLE * 0.9 ? (titleLen >= MAX_TITLE ? 'at-limit' : 'near-limit') : ''}`}>
                {titleLen}/{MAX_TITLE}
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className={`form-control ${errors.description ? 'error' : ''}`}
              placeholder="Describe the issue in detail. Include steps to reproduce, expected vs actual behaviour, error messages, etc."
              rows={8}
              value={form.description}
              onChange={handleChange}
              maxLength={MAX_DESC}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              {errors.description ? <span className="form-error">{errors.description}</span> : <span />}
              <span className={`char-count ${descLen > MAX_DESC * 0.9 ? 'near-limit' : ''}`}>
                {descLen}/{MAX_DESC}
              </span>
            </div>
          </div>

          {/* Optional fields */}
          <details className="optional-fields">
            <summary className="optional-fields__toggle">Optional fields</summary>
            <div className="optional-fields__body">
              <div className="form-group">
                <label className="form-label" htmlFor="repositoryName">Repository Name</label>
                <input
                  id="repositoryName"
                  name="repositoryName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. owner/repo-name"
                  value={form.repositoryName}
                  onChange={handleChange}
                  maxLength={MAX_REPO}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="githubIssueUrl">GitHub Issue URL</label>
                <input
                  id="githubIssueUrl"
                  name="githubIssueUrl"
                  type="url"
                  className="form-control"
                  placeholder="https://github.com/owner/repo/issues/42"
                  value={form.githubIssueUrl}
                  onChange={handleChange}
                />
              </div>
            </div>
          </details>

          <div className="classify-actions">
            <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
              {submitting ? (
                <><span className="spinner" /> Classifying…</>
              ) : (
                'Classify Issue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
