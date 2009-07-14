<?php

class psWidgetFormJQueryTokenAutocompleter extends sfWidgetFormSelectMany
{
  public function configure($options = array(), $attributes = array())
  {
    $this->addRequiredOption('default');
    $this->addOption('multiple', true);
    $this->addOption('init_url');
    $this->addOption('search_url');
    $this->addOption('formatter');
    $this->addOption('theme');
    
    if (isset($options['default']) && is_array($options['default']))
    {
      $this->options['choices'] = array();
      foreach ($options['default'] as $value)
      {
        $this->options['choices'][$value] = $value;
      }
    }
    
    parent::configure($options, $attributes);
  }
  
  public function getJavascripts()
  {
    $javascripts = array(
      '/psToolboxPlugin/js/psWidgetFormJQueryTokenAutocompleter.js'
    );
    
    $theme = $this->getOption('theme', '');
    if ($theme)
    {
      $javascripts[] = "/psToolboxPlugin/ps-wfjta/themes/$theme/js/formatter.js";
    }
    
    return $javascripts;
  }
  
  public function getStylesheets()
  {
    $stylesheets = array();
    
    $theme = $this->getOption('theme', '');
    if ($theme)
    {
      $stylesheets["/psToolboxPlugin/ps-wfjta/themes/$theme/css/style.css"] = 'screen';
    }
    
    return $stylesheets;
  }
  
  public function render($name, $value = null, $attributes = array(), $errors = array())
  {
    $options = array(
      'select' => '%id%',
      'urls' => array(
        'init' => $this->getOption('init_url', ''), 
        'search' => $this->getOption('search_url', '')
      )
    );
    
    // add formatter
    $theme = $this->getOption('theme', '');
    if ($theme)
    {
      $options['formatter'] = 'psWFJTAFormatter';
    }
    else
    {
      $formatter = $this->getOption('formatter', '');
      if ($formatter)
      {
        $options['formatter'] = $formatter;
      }
    }
    
    // widget id
    $widgetId = '';
    if (isset($attributes['id']))
    {
      $widgetId = sprintf(' id="%s"', $attributes['id']);
      unset($attributes['id']); // dont give the id to parent widget
    }

    $javascript = '<script type="text/javascript">new psWidgetFormJQueryTokenAutocompleter(%options%);</script>';
    
    $html  = "<div$widgetId class=\"ps-wfjta ps-wfjta-empty\">";
    $html .= parent::render($name, $value, $attributes, $errors);
    $html .= "</div>";
    $html .= str_replace('%options%', json_encode($options), $javascript);
    $html  = str_replace('"%id%"', sprintf('jQuery(\'#%s\')', $this->generateId($name)), $html);
    
    return $html;
  }
}
